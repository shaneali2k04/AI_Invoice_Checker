"""
Invoice extraction library (PDF -> per-page structured invoice data).

Design goals:
- **No hallucination**: if a field is unreadable or low-confidence, it is forced to null.
- **Model-agnostic shape**: stable Python objects returned to callers (backend, CLI).
- **Safe defaults**: missing/invalid values become null, not guessed.
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

import fitz  # PyMuPDF
from pydantic import BaseModel, ValidationError, field_validator

from google import genai
from google.genai import types

DEFAULT_CONFIDENCE_THRESHOLD = 0.7


INVOICE_FIELDS: list[str] = [
    "Invoice_Date",
    "Invoice_No",
    "Supplier_Name",
    "Supplier_NTN",
    "Supplier_GST_No",
    "Supplier_Registration_No",
    "Buyer_Name",
    "Buyer_NTN",
    "Buyer_GST_No",
    "Buyer_Registration_No",
    "Exclusive_Value",
    "GST_Sales_Tax",
    "Inclusive_Value",
    "Advance_Tax",
    "Net_Amount",
    "Return",
    "Discount",
    "Incentive",
    "Location",
    "GRN",
]

# Fields the user considers mandatory for review/flags.
#
# 1) Mandatory financial fields (required individually):
# - Net_Amount
# - Inclusive_Value (Total)
# - Discount
# - Return
# - Incentive
#
# 2) Mandatory supplier identifiers (required as a GROUP):
# At least ONE of these must be present:
# - Supplier_NTN / Supplier_GST_No / Supplier_Registration_No
#
# All other fields are optional: if not present on an invoice, leave blank (null)
# and do not flag them as missing.
FINANCIAL_MANDATORY_FIELDS: set[str] = {
    "Net_Amount",
    "Inclusive_Value",  # Total
    "Discount",
    "Return",
    "Incentive",
}

SUPPLIER_ID_FIELDS: tuple[str, ...] = ("Supplier_NTN", "Supplier_GST_No", "Supplier_Registration_No")

# Fields that should be forced null if confidence is low (no-guess gating).
# IDs should never be guessed.
LOW_CONF_GATED_FIELDS: set[str] = set(FINANCIAL_MANDATORY_FIELDS) | set(SUPPLIER_ID_FIELDS)


def _has_supplier_id(cleaned: dict[str, Any]) -> bool:
    return any(cleaned.get(f) not in (None, "", " ") for f in SUPPLIER_ID_FIELDS)


def _is_missing_required_field(cleaned: dict[str, Any], field_name: str) -> bool:
    """
    True when the field should be flagged as missing (required for review).
    - Financial mandatory fields: always required individually.
    - Supplier identifiers: required as a GROUP (at least one must exist).
      If none exist, we mark all supplier ID fields as missing so the UI clearly flags the problem.
    """
    if field_name in FINANCIAL_MANDATORY_FIELDS:
        v = cleaned.get(field_name)
        return v is None or str(v).strip() == ""
    if field_name in SUPPLIER_ID_FIELDS:
        return not _has_supplier_id(cleaned)
    return False

NUMERIC_FIELDS: set[str] = {
    "Exclusive_Value",
    "GST_Sales_Tax",
    "Inclusive_Value",
    "Advance_Tax",
    "Net_Amount",
    "Return",
    "Discount",
    "Incentive",
}


class InvoiceModel(BaseModel):
    """
    Normalized, typed invoice model.
    All fields are optional to allow partial extraction without guessing.
    """

    Invoice_Date: Optional[str] = None
    Invoice_No: Optional[str] = None

    Supplier_Name: Optional[str] = None
    Supplier_NTN: Optional[str] = None
    Supplier_GST_No: Optional[str] = None
    Supplier_Registration_No: Optional[str] = None

    Buyer_Name: Optional[str] = None
    Buyer_NTN: Optional[str] = None
    Buyer_GST_No: Optional[str] = None
    Buyer_Registration_No: Optional[str] = None

    Exclusive_Value: Optional[float] = None
    GST_Sales_Tax: Optional[float] = None
    Inclusive_Value: Optional[float] = None
    Advance_Tax: Optional[float] = None
    Net_Amount: Optional[float] = None

    Return: Optional[float] = None
    Discount: Optional[float] = None
    Incentive: Optional[float] = None

    Location: Optional[str] = None
    GRN: Optional[str] = None

    @field_validator(
        "Exclusive_Value",
        "GST_Sales_Tax",
        "Inclusive_Value",
        "Advance_Tax",
        "Net_Amount",
        "Return",
        "Discount",
        "Incentive",
        mode="before",
    )
    @classmethod
    def _parse_number(cls, v: Any) -> Optional[float]:
        if v is None:
            return None
        if isinstance(v, (int, float)):
            return float(v)
        if isinstance(v, str):
            s = v.strip()
            if not s:
                return None
            s = s.replace(",", "")
            s = re.sub(r"[^0-9.\-]", "", s)
            if not s or s in {"-", ".", "-.", ".-"}:
                return None
            try:
                return float(s)
            except ValueError:
                return None
        return None


def load_env_file(env_path: Path) -> None:
    """Load KEY=VALUE pairs into environment (if missing)."""
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def extract_json_from_text(text: str) -> Optional[dict[str, Any]]:
    """
    Best-effort JSON object extraction from model output.
    We intentionally keep this conservative; if parsing fails, callers should rescan/retry.
    """
    match = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


def clean_invoice_data(raw: dict[str, Any]) -> dict[str, Any]:
    """Normalize to expected keys and coerce numeric fields; invalid values become null."""
    normalized = {f: raw.get(f, None) for f in INVOICE_FIELDS}
    try:
        inv = InvoiceModel.model_validate(normalized)
        return inv.model_dump()
    except ValidationError:
        cleaned: dict[str, Any] = {}
        for f in INVOICE_FIELDS:
            value = normalized.get(f)
            if f in NUMERIC_FIELDS:
                value = InvoiceModel._parse_number(value)
            cleaned[f] = value
        return cleaned


def build_prompt() -> str:
    """
    Prompt that forces:
    - strict JSON only
    - self-reported readability/confidence
    - explicit nulling instead of guessing
    """
    fields_block = "\n".join([f'    "{f}": <value-or-null>,' for f in INVOICE_FIELDS])
    fields_block = fields_block.rstrip(",")

    return f"""
Extract invoice data and return ONLY valid JSON.

You may be given MULTIPLE images of the SAME invoice page (full page + zoomed crops).
Use the clearest/most readable view for each field. If different views conflict, set the field to null and mark it unreadable (do NOT guess).

Important:
- Handwriting: If a handwritten value is clearly readable, extract it and treat it as OK (do not flag "handwritten" just because it is handwritten).
  Only mark fields as unreadable/blurry/faded/cut_off when you truly cannot read the text/digits.
- Return field synonyms: "Return" may appear as Return / RET / RT / RTN / Returned / Sales Return / SR / "Less Return" / "Less RT".
  If you see these, extract the corresponding amount into Return. If it is unclear which amount maps to Return, set Return=null and mark it ambiguous.
- Total amount: If the invoice shows Total / Grand Total / Total Amount / Amount Payable, extract it as Inclusive_Value (Total). If truly not present, set Inclusive_Value=null.
- Discount: If shown as Discount / Disc / Less Discount, extract it as Discount. If not present, set Discount=null.
- Incentive: If shown as Incentive / Scheme / Trade Offer, extract it as Incentive. If not present, set Incentive=null.
- Net_Amount: If a final payable/total amount is clearly written (even handwritten), extract it as a number.
  Do NOT set Net_Amount to null just because intermediate calculations don't match; keep the value and explain the mismatch in the diagnostic reason.
- Do NOT validate or "correct" date formats. For Invoice_Date, extract the raw date text AS SEEN (e.g. "10/10/24", "40,12,25", "2025-01-22").
  Only set Invoice_Date to null if you truly cannot read the date digits.
- Set quality.needs_rescan=true ONLY when the image is blurry/faded/cut off such that mandatory fields cannot be read.
  Do NOT request rescan for mere formatting oddities.

Required JSON shape:
{{
  "data": {{
{fields_block}
  }},
  "quality": {{
    "needs_rescan": <true|false>,
    "reasons": [<string>],
    "unreadable_fields": [<field name>],
    "field_confidence": {{ "<field name>": <number 0..1> }},
    "field_diagnostics": {{
      "<field name>": {{
        "status": "<ok|missing|unreadable|blurry|faded|cut_off|handwritten|ambiguous>",
        "reason": "<short reason>",
        "confidence": <number 0..1>
      }}
    }}
  }}
}}

Rules:
- If you are not sure about any field: set it to null, add it to unreadable_fields, and lower its field_confidence.
- Never guess or reconstruct missing digits.
- Numeric values must be numbers (not strings). Missing fields must be null.
- Output must be ONLY JSON (no markdown, no explanations).
""".strip()


@dataclass
class PageExtraction:
    page_no: int
    data: dict[str, Any]
    raw_quality: dict[str, Any]
    needs_rescan: bool
    unreadable_fields: list[str]
    reasons: list[str]
    avg_field_confidence: Optional[float]
    system_confidence: Optional[float]
    system_reasons: list[str]
    field_diagnostics: dict[str, Any]
    raw_text: str


def _render_image_bytes(
    page: fitz.Page,
    *,
    dpi: int,
    clip: Optional[fitz.Rect] = None,
    image_format: str = "jpeg",
) -> bytes:
    """
    Render a page (or clipped region) to image bytes.
    Using JPEG is typically much smaller/faster to send to VLM than PNG.
    """
    pix = page.get_pixmap(dpi=dpi, clip=clip)
    fmt = (image_format or "jpeg").lower().strip()
    if fmt in {"jpg", "jpeg"}:
        return pix.tobytes("jpeg")
    return pix.tobytes("png")


def build_batch_prompt(*, batch_count: int) -> str:
    """
    Prompt for batching multiple pages in a single VLM call.
    The model must return a JSON object with a `pages` array, one entry per image.
    """
    fields_block = "\n".join([f'        "{f}": <value-or-null>,' for f in INVOICE_FIELDS]).rstrip(",")
    return f"""
You will be given {batch_count} invoice page images. Each image is a DIFFERENT invoice page.
Return ONLY valid JSON.

Important:
- Handwriting: If a handwritten value is clearly readable, extract it and treat it as OK (do not flag "handwritten" just because it is handwritten).
  Only mark fields as unreadable/blurry/faded/cut_off when you truly cannot read the text/digits.
- Return field synonyms: "Return" may appear as Return / RET / RT / RTN / Returned / Sales Return / SR / "Less Return" / "Less RT".
  If you see these, extract the corresponding amount into Return. If it is unclear which amount maps to Return, set Return=null and mark it ambiguous.
- Net_Amount: If a final payable/total amount is clearly written (even handwritten), extract it as a number.
  Do NOT set Net_Amount to null just because intermediate calculations don't match; keep the value and explain the mismatch in the diagnostic reason.
- Do NOT validate or "correct" date formats. For Invoice_Date, extract the raw date text AS SEEN.
  Only set Invoice_Date to null if you truly cannot read the date digits.

Required JSON shape:
{{
  "pages": [
    {{
      "page_index": <1..{batch_count}>,
      "data": {{
{fields_block}
      }},
      "quality": {{
        "needs_rescan": <true|false>,
        "reasons": [<string>],
        "unreadable_fields": [<field name>],
        "field_confidence": {{ "<field name>": <number 0..1> }},
        "field_diagnostics": {{
          "<field name>": {{
            "status": "<ok|missing|unreadable|blurry|faded|cut_off|handwritten|ambiguous>",
            "reason": "<short reason>",
            "confidence": <number 0..1>
          }}
        }}
      }}
    }}
  ]
}}

Rules:
- Never guess or reconstruct missing digits.
- If you are not sure about any field: set it to null, add it to unreadable_fields, and lower its confidence.
- Output must be ONLY JSON (no markdown, no explanations).
""".strip()


def _quadrant_clips(page: fitz.Page) -> list[tuple[str, fitz.Rect]]:
    r = page.rect
    mx = (r.x0 + r.x1) / 2.0
    my = (r.y0 + r.y1) / 2.0
    return [
        ("top_left", fitz.Rect(r.x0, r.y0, mx, my)),
        ("top_right", fitz.Rect(mx, r.y0, r.x1, my)),
        ("bottom_left", fitz.Rect(r.x0, my, mx, r.y1)),
        ("bottom_right", fitz.Rect(mx, my, r.x1, r.y1)),
    ]


def _score_attempt(p: PageExtraction) -> tuple[float, float, int]:
    """
    Higher is better.
    - Prefer higher system confidence
    - Then higher average model confidence (if present)
    - Then fewer unreadable fields
    """
    sysc = float(p.system_confidence) if p.system_confidence is not None else 0.0
    avgc = float(p.avg_field_confidence) if p.avg_field_confidence is not None else 0.0
    unreadable_count = len(p.unreadable_fields or [])
    return (sysc, avgc, -unreadable_count)


def _should_retry_render(p: PageExtraction) -> bool:
    """
    Decide whether to retry extraction with a better render plan (higher DPI + crops).
    """
    # Only retry when there are true readability issues (blurry/faded/unreadable/low confidence),
    # not just "needs review" for business reasons.
    if p.needs_rescan:
        return True
    if p.system_confidence is not None and p.system_confidence < 0.60:
        return True
    if p.reasons and any(r in {"low_field_confidence", "model_flagged_unreadable", "json_parse_failed"} for r in p.reasons):
        return True
    diag = p.field_diagnostics or {}
    if isinstance(diag, dict):
        for v in diag.values():
            if isinstance(v, dict) and str(v.get("status") or "").lower() in {"unreadable", "blurry", "faded", "cut_off"}:
                return True
    return False


def _parse_quality(payload: dict[str, Any]) -> tuple[dict[str, Any], bool, list[str], list[str], Optional[float]]:
    quality = payload.get("quality") if isinstance(payload, dict) else None
    if not isinstance(quality, dict):
        return {}, False, [], [], None

    needs_rescan = bool(quality.get("needs_rescan", False))
    reasons = quality.get("reasons") if isinstance(quality.get("reasons"), list) else []
    unreadable = (
        quality.get("unreadable_fields")
        if isinstance(quality.get("unreadable_fields"), list)
        else []
    )

    conf_map = quality.get("field_confidence")
    avg_conf = None
    if isinstance(conf_map, dict) and conf_map:
        vals: list[float] = []
        for v in conf_map.values():
            try:
                fv = float(v)
                if 0 <= fv <= 1:
                    vals.append(fv)
            except (TypeError, ValueError):
                pass
        if vals:
            avg_conf = sum(vals) / len(vals)

    return quality, needs_rescan, unreadable, reasons, avg_conf


def _build_field_diagnostics(
    *,
    cleaned: dict[str, Any],
    quality: dict[str, Any],
    unreadable_fields: list[str],
    confidence_threshold: float,
) -> dict[str, Any]:
    """
    Build a per-field diagnostic map for UI/audit.

    Expected output shape:
    {
      "Invoice_No": {"status": "...", "reason": "...", "confidence": 0.0..1.0, "requires_audit": bool}
      ...
    }
    """
    diag: dict[str, Any] = {}

    # Prefer model-provided diagnostics if present.
    raw_diag = quality.get("field_diagnostics") if isinstance(quality, dict) else None
    conf_map = quality.get("field_confidence") if isinstance(quality, dict) else None

    unreadable = set(unreadable_fields)

    def _reason_says_not_found(r: str) -> bool:
        rr = (r or "").strip().lower()
        return any(
            s in rr
            for s in [
                "field not found",
                "not found on invoice",
                "not found on the invoice",
                "not present",
                "not provided",
                "not available on invoice",
            ]
        )

    for f in INVOICE_FIELDS:
        model_entry = raw_diag.get(f) if isinstance(raw_diag, dict) else None

        status = "ok"
        reason = ""
        conf: Optional[float] = None

        if isinstance(model_entry, dict):
            status = str(model_entry.get("status") or "ok").strip() or "ok"
            reason = str(model_entry.get("reason") or "").strip()
            try:
                conf = float(model_entry.get("confidence")) if model_entry.get("confidence") is not None else None
            except (TypeError, ValueError):
                conf = None

        # Tighten diagnostics: "not found on invoice" is MISSING, not BLURRY.
        # Some models overuse blur/unreadable labels when a field is simply absent.
        if _reason_says_not_found(reason):
            if cleaned.get(f) is None:
                status = "missing" if _is_missing_required_field(cleaned, f) else "ok"
                # When a field is absent, confidence is not meaningful.
                conf = 0.0

        if conf is None and isinstance(conf_map, dict) and f in conf_map:
            try:
                conf = float(conf_map.get(f))
            except (TypeError, ValueError):
                conf = None

        # Treat handwritten values as acceptable when a value is present.
        # We only want to flag true readability problems, not "handwritten" as a category.
        if str(status).lower() == "handwritten":
            has_value = cleaned.get(f) is not None and str(cleaned.get(f)).strip() != ""
            if has_value:
                status = "ok"
                if reason:
                    reason = f"{reason} (handwritten but clear)"
                else:
                    reason = "Handwritten but clear"

        # Derive status if model didn't provide something actionable.
        # IMPORTANT: missing/absent is NOT the same as unreadable/blurred.
        if status == "ok":
            if cleaned.get(f) is None:
                # Only mark missing for mandatory fields; optional fields stay un-flagged.
                status = "missing" if _is_missing_required_field(cleaned, f) else "ok"
            elif f in unreadable:
                status = "unreadable"

        requires_audit = (status in {"ambiguous"}) or (
            (f in LOW_CONF_GATED_FIELDS) and (conf is not None and conf < confidence_threshold)
        )

        diag[f] = {
            "status": status,
            "reason": reason,
            "confidence": conf,
            "requires_audit": requires_audit,
        }

    return diag


def _apply_no_guess_policy(
    cleaned: dict[str, Any],
    *,
    quality: dict[str, Any],
    unreadable_fields: list[str],
    reasons: list[str],
    confidence_threshold: float = 0.7,
) -> tuple[dict[str, Any], list[str], list[str]]:
    """
    Enforce "do not hallucinate":
    - If a field is marked unreadable -> force it to null.
    - If field_confidence[field] < threshold -> force it to null and mark unreadable.
    """
    cleaned = dict(cleaned)  # avoid mutating caller state
    unreadable = set(unreadable_fields)
    next_reasons = list(reasons)

    conf_map = quality.get("field_confidence") if isinstance(quality, dict) else None
    low_conf: set[str] = set()
    if isinstance(conf_map, dict):
        for k, v in conf_map.items():
            if k not in INVOICE_FIELDS:
                continue
            try:
                fv = float(v)
            except (TypeError, ValueError):
                continue
            if 0 <= fv < confidence_threshold:
                # Only low-confidence mandatory fields are treated as "unreadable" (must be reviewed).
                # Optional fields are allowed to be absent without being flagged.
                if k in LOW_CONF_GATED_FIELDS:
                    low_conf.add(k)

    if low_conf:
        unreadable |= low_conf
        if "low_field_confidence" not in next_reasons:
            next_reasons.append("low_field_confidence")

    # Tighten: don't blindly trust `unreadable_fields` when diagnostics show the value is readable.
    # Some model outputs mark fields unreadable for "business ambiguity" (e.g., totals mismatch).
    raw_diag = quality.get("field_diagnostics") if isinstance(quality, dict) else None
    if isinstance(raw_diag, dict):
        def _reason_says_unreadable(r: str) -> bool:
            rr = (r or "").strip().lower()
            return any(
                s in rr
                for s in [
                    "unreadable",
                    "illegible",
                    "blur",
                    "blurry",
                    "faded",
                    "smudged",
                    "cut off",
                    "cropped",
                    "too small",
                    "cannot read",
                    "can't read",
                ]
            )

        for field_name, meta in raw_diag.items():
            if field_name not in INVOICE_FIELDS or not isinstance(meta, dict):
                continue
            status = str(meta.get("status") or "").strip().lower()
            reason = str(meta.get("reason") or "").strip()
            has_value = cleaned.get(field_name) is not None and str(cleaned.get(field_name)).strip() != ""
            # If the model says it's OK/handwritten (and readable), don't force-null it.
            if has_value and status in {"ok", "handwritten"}:
                unreadable.discard(field_name)
            # If it's "ambiguous" but not actually unreadable, keep the value.
            if has_value and status == "ambiguous" and not _reason_says_unreadable(reason):
                unreadable.discard(field_name)

    # Force nulls for unreadable fields.
    for f in unreadable:
        if f in cleaned:
            cleaned[f] = None

    # If the model explicitly says a field is blurry/faded/cut_off/unreadable/ambiguous,
    # treat it as unreadable (do not trust the value).
    if isinstance(raw_diag, dict):
        def _reason_says_not_found(r: str) -> bool:
            rr = (r or "").strip().lower()
            return any(
                s in rr
                for s in [
                    "field not found",
                    "not found on invoice",
                    "not found on the invoice",
                    "not present",
                    "not provided",
                    "not available on invoice",
                ]
            )

        def _reason_says_unreadable(r: str) -> bool:
            rr = (r or "").strip().lower()
            return any(
                s in rr
                for s in [
                    "unreadable",
                    "illegible",
                    "blurry",
                    "blur",
                    "faded",
                    "smudged",
                    "cut off",
                    "cropped",
                    "too small",
                    "cannot read",
                    "can't read",
                ]
            )

        for field_name, meta in raw_diag.items():
            if field_name not in INVOICE_FIELDS or not isinstance(meta, dict):
                continue
            status = str(meta.get("status") or "").strip().lower()
            reason = str(meta.get("reason") or "").strip()

            # If it's simply not present on the invoice, don't treat it as unreadable.
            if status == "missing" or _reason_says_not_found(reason):
                continue

            # "ambiguous" is NOT always a readability issue; only null it when the digits/text
            # are actually unreadable. Otherwise keep the extracted value and let diagnostics
            # drive review without forcing rescan.
            if status == "ambiguous" and not _reason_says_unreadable(reason):
                continue

            if status in {"unreadable", "blurry", "faded", "cut_off", "ambiguous"}:
                unreadable.add(field_name)
                cleaned[field_name] = None
                if "model_flagged_unreadable" not in next_reasons:
                    next_reasons.append("model_flagged_unreadable")

    return cleaned, sorted(unreadable), next_reasons


def extract_from_pdf_bytes(
    pdf_bytes: bytes,
    *,
    api_key: str,
    model_name: str = "gemini-2.5-flash",
    dpi: int = 200,
    only_page: Optional[int] = None,  # 1-based if provided
    page_numbers: Optional[list[int]] = None,  # 1-based if provided
    confidence_threshold: float = DEFAULT_CONFIDENCE_THRESHOLD,
    render_retry: bool = True,
    retry_dpi: int = 300,
    batch_size: int = 3,
    image_format: str = "jpeg",
) -> list[PageExtraction]:
    client = genai.Client(api_key=api_key)
    prompt_single = build_prompt()

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    results: list[PageExtraction] = []

    page_indices: list[int] = list(range(len(doc)))
    if page_numbers:
        # Keep original order, drop invalids, de-dupe.
        seen: set[int] = set()
        picked: list[int] = []
        for p in page_numbers:
            try:
                idx0 = int(p) - 1
            except Exception:
                continue
            if not (0 <= idx0 < len(doc)):
                continue
            if idx0 in seen:
                continue
            seen.add(idx0)
            picked.append(idx0)
        page_indices = picked
        only_page = None
    elif only_page is not None:
        idx = max(1, only_page) - 1
        page_indices = [idx] if 0 <= idx < len(doc) else []

    def _extract_single_attempt(
        *,
        page: fitz.Page,
        page_no_0: int,
        base_dpi: int,
        include_quadrants: bool,
        attempt_tag: str,
    ) -> PageExtraction:
        # Build a multi-image payload: full page + optional zoom crops.
        contents: list[Any] = [prompt_single]

        full_img = _render_image_bytes(page, dpi=base_dpi, image_format=image_format)
        contents.extend(
            [
                f"Image: full_page (dpi={base_dpi})",
                types.Part.from_bytes(data=full_img, mime_type="image/jpeg" if (image_format or "").lower() in {"jpg","jpeg"} else "image/png"),
            ]
        )

        if include_quadrants:
            for label, clip in _quadrant_clips(page):
                img = _render_image_bytes(page, dpi=base_dpi, clip=clip, image_format=image_format)
                contents.extend(
                    [
                        f"Image: zoom_{label} (dpi={base_dpi})",
                        types.Part.from_bytes(data=img, mime_type="image/jpeg" if (image_format or "").lower() in {"jpg","jpeg"} else "image/png"),
                    ]
                )

        response = client.models.generate_content(model=model_name, contents=contents)
        raw_text = getattr(response, "text", "") or ""
        payload = extract_json_from_text(raw_text)

        if not payload:
            return PageExtraction(
                page_no=page_no_0 + 1,
                data={f: None for f in INVOICE_FIELDS},
                raw_quality={},
                needs_rescan=True,
                unreadable_fields=INVOICE_FIELDS.copy(),
                reasons=[f"json_parse_failed:{attempt_tag}"],
                avg_field_confidence=None,
                system_confidence=0.0,
                system_reasons=["json_parse_failed"],
                field_diagnostics={
                    f: {"status": "unreadable", "reason": "json_parse_failed", "confidence": 0.0, "requires_audit": True}
                    for f in INVOICE_FIELDS
                },
                raw_text=raw_text,
            )

        # Support either {"data": {...}} or direct field dict for backward compatibility
        raw_data = payload.get("data") if isinstance(payload.get("data"), dict) else payload
        cleaned = clean_invoice_data(raw_data if isinstance(raw_data, dict) else {})

        raw_quality, needs_rescan, unreadable, reasons, avg_conf = _parse_quality(payload)

        # Enforce non-hallucination policy using model-reported quality signals.
        cleaned, unreadable, reasons = _apply_no_guess_policy(
            cleaned,
            quality=raw_quality,
            unreadable_fields=unreadable,
            reasons=reasons,
            confidence_threshold=confidence_threshold,
        )

        field_diagnostics = _build_field_diagnostics(
            cleaned=cleaned,
            quality=raw_quality,
            unreadable_fields=unreadable,
            confidence_threshold=confidence_threshold,
        )

        # Deterministic validation-derived confidence (system confidence).
        system_reasons: list[str] = []
        system_conf = 1.0

        # Missing mandatory financial fields is a strong signal.
        key_fields = ["Net_Amount", "Inclusive_Value", "Discount", "Return", "Incentive"]
        missing_key = [f for f in key_fields if not cleaned.get(f)]
        if missing_key:
            system_reasons.append("missing_key_fields")
            system_conf -= 0.5

        # Supplier identifiers are required as a group (at least one).
        if not _has_supplier_id(cleaned):
            system_reasons.append("missing_supplier_identifiers")
            system_conf -= 0.3

        # Supplier identifiers are required as a group (at least one).
        if not _has_supplier_id(cleaned):
            system_reasons.append("missing_supplier_identifiers")
            system_conf -= 0.3

        # Numeric reconciliation: Inclusive ≈ Exclusive + GST (within 2% or 10 absolute).
        try:
            exc = float(cleaned.get("Exclusive_Value") or 0)
            gst = float(cleaned.get("GST_Sales_Tax") or 0)
            inc = float(cleaned.get("Inclusive_Value") or 0)
            if exc > 0 and inc > 0:
                expected = exc + gst
                diff = abs(inc - expected)
                tol = max(10.0, 0.02 * expected)
                if diff > tol:
                    system_reasons.append("totals_mismatch")
                    system_conf -= 0.3
        except Exception:
            # ignore parsing issues here; missing/invalid already penalized above
            pass

        # If any fields are unreadable/low-confidence, keep confidence conservative.
        if unreadable:
            system_reasons.append("unreadable_or_low_conf_fields")
            system_conf = min(system_conf, 0.4)

        # Ambiguous fields should be audited (handwritten is OK if a value is present).
        needs_audit_fields = [
            f
            for f, d in field_diagnostics.items()
            if isinstance(d, dict) and d.get("status") in {"ambiguous"}
        ]
        if needs_audit_fields:
            system_reasons.append("handwritten_or_ambiguous_fields")
            system_conf = min(system_conf, 0.6)

        # Missing key fields should trigger REVIEW, not necessarily RESCAN.
        # RESCAN is reserved for true readability issues (blurry/unreadable), not absent fields.
        if missing_key:
            if "missing_key_fields" not in reasons:
                reasons = reasons + ["missing_key_fields"]

        # Rescan is ONLY for true readability issues (blurry/faded/cut_off/unreadable),
        # not for missing/absent fields or business-rule review.
        diag_for_rescan = field_diagnostics or {}
        def _diag_triggers_rescan(v: Any) -> bool:
            if not isinstance(v, dict):
                return False
            status = str(v.get("status") or "").strip().lower()
            reason = str(v.get("reason") or "").strip().lower()
            if status in {"blurry", "faded", "cut_off"}:
                return True
            if status == "unreadable":
                # Only rescan if it's unreadable due to image quality (not "not found" / mapping ambiguity).
                return any(s in reason for s in ["unreadable", "illegible", "blur", "blurry", "faded", "smudged", "cut off", "cropped", "too small", "cannot read", "can't read"])
            return False
        needs_rescan = any(_diag_triggers_rescan(v) for v in diag_for_rescan.values()) or (
            bool(raw_quality.get("needs_rescan")) and any(_diag_triggers_rescan(v) for v in diag_for_rescan.values())
        )

        # Tag attempt for traceability.
        reasons = list(reasons or [])
        reasons.append(f"attempt:{attempt_tag}")

        return PageExtraction(
            page_no=page_no_0 + 1,
            data=cleaned,
            raw_quality=raw_quality,
            needs_rescan=needs_rescan,
            unreadable_fields=unreadable,
            reasons=reasons,
            avg_field_confidence=avg_conf,
            system_confidence=max(0.0, min(1.0, system_conf)),
            system_reasons=sorted(set(system_reasons)),
            field_diagnostics=field_diagnostics,
            raw_text=raw_text,
        )

    for page_no in page_indices:
        # (handled below in chunked/batched loop)
        pass

    # Batch pages for faster throughput: fewer VLM calls.
    page_list = list(page_indices)
    if only_page is not None and not page_numbers:
        batch_size = 1
    batch_size = max(1, int(batch_size or 1))

    def _postprocess_page_payload(*, page_no_0: int, raw_text: str, payload: dict[str, Any], attempt_tag: str) -> PageExtraction:
        raw_data = payload.get("data") if isinstance(payload.get("data"), dict) else payload
        cleaned = clean_invoice_data(raw_data if isinstance(raw_data, dict) else {})
        raw_quality, needs_rescan, unreadable, reasons, avg_conf = _parse_quality(payload)
        cleaned, unreadable, reasons = _apply_no_guess_policy(
            cleaned,
            quality=raw_quality,
            unreadable_fields=unreadable,
            reasons=reasons,
            confidence_threshold=confidence_threshold,
        )
        field_diagnostics = _build_field_diagnostics(
            cleaned=cleaned,
            quality=raw_quality,
            unreadable_fields=unreadable,
            confidence_threshold=confidence_threshold,
        )

        system_reasons: list[str] = []
        system_conf = 1.0
        key_fields = ["Net_Amount", "Inclusive_Value", "Discount", "Return", "Incentive"]
        missing_key = [f for f in key_fields if not cleaned.get(f)]
        if missing_key:
            system_reasons.append("missing_key_fields")
            system_conf -= 0.5

        if not _has_supplier_id(cleaned):
            system_reasons.append("missing_supplier_identifiers")
            system_conf -= 0.3

        if not _has_supplier_id(cleaned):
            system_reasons.append("missing_supplier_identifiers")
            system_conf -= 0.3
        try:
            exc = float(cleaned.get("Exclusive_Value") or 0)
            gst = float(cleaned.get("GST_Sales_Tax") or 0)
            inc = float(cleaned.get("Inclusive_Value") or 0)
            if exc > 0 and inc > 0:
                expected = exc + gst
                diff = abs(inc - expected)
                tol = max(10.0, 0.02 * expected)
                if diff > tol:
                    system_reasons.append("totals_mismatch")
                    system_conf -= 0.3
        except Exception:
            pass
        if unreadable:
            system_reasons.append("unreadable_or_low_conf_fields")
            system_conf = min(system_conf, 0.4)
        needs_audit_fields = [
            f for f, d in field_diagnostics.items()
            if isinstance(d, dict) and d.get("status") in {"ambiguous"}
        ]
        if needs_audit_fields:
            system_reasons.append("handwritten_or_ambiguous_fields")
            system_conf = min(system_conf, 0.6)
        # Missing key fields should trigger REVIEW, not necessarily RESCAN.
        if missing_key:
            if "missing_key_fields" not in reasons:
                reasons = reasons + ["missing_key_fields"]
        diag_for_rescan = field_diagnostics or {}
        def _diag_triggers_rescan(v: Any) -> bool:
            if not isinstance(v, dict):
                return False
            status = str(v.get("status") or "").strip().lower()
            reason = str(v.get("reason") or "").strip().lower()
            if status in {"blurry", "faded", "cut_off"}:
                return True
            if status == "unreadable":
                return any(s in reason for s in ["unreadable", "illegible", "blur", "blurry", "faded", "smudged", "cut off", "cropped", "too small", "cannot read", "can't read"])
            return False
        needs_rescan = any(_diag_triggers_rescan(v) for v in diag_for_rescan.values()) or (
            bool(raw_quality.get("needs_rescan")) and any(_diag_triggers_rescan(v) for v in diag_for_rescan.values())
        )

        reasons = list(reasons or [])
        reasons.append(f"attempt:{attempt_tag}")

        pe = PageExtraction(
            page_no=page_no_0 + 1,
            data=cleaned,
            raw_quality=raw_quality,
            needs_rescan=needs_rescan,
            unreadable_fields=unreadable,
            reasons=reasons,
            avg_field_confidence=avg_conf,
            system_confidence=max(0.0, min(1.0, system_conf)),
            system_reasons=sorted(set(system_reasons)),
            field_diagnostics=field_diagnostics,
            raw_text=raw_text,
        )
        if pe.needs_rescan:
            pe.reasons = sorted(set((pe.reasons or []) + ["human_review_required"]))
        return pe

    for start in range(0, len(page_list), batch_size):
        chunk = page_list[start:start + batch_size]
        if not chunk:
            continue

        # If we only have one page, just use the original single-page path.
        if len(chunk) == 1:
            page_no = chunk[0]
            page = doc[page_no]
            first = _extract_single_attempt(
                page=page,
                page_no_0=page_no,
                base_dpi=dpi,
                include_quadrants=False,
                attempt_tag="base_full",
            )
            best = first
            if render_retry and _should_retry_render(first):
                second = _extract_single_attempt(
                    page=page,
                    page_no_0=page_no,
                    base_dpi=retry_dpi,
                    include_quadrants=True,
                    attempt_tag="retry_zoom",
                )
                best = max([first, second], key=_score_attempt)
                if best is second:
                    best.reasons = sorted(set((best.reasons or []) + ["render_retry_used"]))
            results.append(best)
            continue

        batch_prompt = build_batch_prompt(batch_count=len(chunk))
        contents: list[Any] = [batch_prompt]
        for idx_in_batch, page_no in enumerate(chunk, start=1):
            page = doc[page_no]
            img = _render_image_bytes(page, dpi=dpi, image_format=image_format)
            contents.extend(
                [
                    f"Image page_index={idx_in_batch}",
                    types.Part.from_bytes(
                        data=img,
                        mime_type="image/jpeg" if (image_format or "").lower() in {"jpg","jpeg"} else "image/png",
                    ),
                ]
            )

        response = client.models.generate_content(model=model_name, contents=contents)
        raw_text = getattr(response, "text", "") or ""
        payload = extract_json_from_text(raw_text)

        pages_payload = []
        if isinstance(payload, dict) and isinstance(payload.get("pages"), list):
            pages_payload = payload.get("pages") or []

        # Map returned pages by page_index
        by_index: dict[int, dict[str, Any]] = {}
        for entry in pages_payload:
            if isinstance(entry, dict):
                try:
                    pi = int(entry.get("page_index"))
                except Exception:
                    continue
                by_index[pi] = entry

        for idx_in_batch, page_no in enumerate(chunk, start=1):
            entry = by_index.get(idx_in_batch)
            if not isinstance(entry, dict):
                # fallback: mark as parse failure for this page
                results.append(
                    PageExtraction(
                        page_no=page_no + 1,
                        data={f: None for f in INVOICE_FIELDS},
                        raw_quality={},
                        needs_rescan=True,
                        unreadable_fields=INVOICE_FIELDS.copy(),
                        reasons=[f"json_parse_failed:batch_{len(chunk)}"],
                        avg_field_confidence=None,
                        system_confidence=0.0,
                        system_reasons=["json_parse_failed"],
                        field_diagnostics={
                            f: {"status": "unreadable", "reason": "json_parse_failed", "confidence": 0.0, "requires_audit": True}
                            for f in INVOICE_FIELDS
                        },
                        raw_text=raw_text,
                    )
                )
                continue

            pe = _postprocess_page_payload(page_no_0=page_no, raw_text=raw_text, payload=entry, attempt_tag=f"batch_{len(chunk)}")
            # Optional per-page retry with zoom crops only when truly needed.
            best = pe
            if render_retry and _should_retry_render(pe):
                page = doc[page_no]
                second = _extract_single_attempt(
                    page=page,
                    page_no_0=page_no,
                    base_dpi=retry_dpi,
                    include_quadrants=True,
                    attempt_tag="retry_zoom",
                )
                best = max([pe, second], key=_score_attempt)
                if best is second:
                    best.reasons = sorted(set((best.reasons or []) + ["render_retry_used"]))
            results.append(best)

    return results


__all__ = [
    "INVOICE_FIELDS",
    "NUMERIC_FIELDS",
    "PageExtraction",
    "build_prompt",
    "clean_invoice_data",
    "extract_from_pdf_bytes",
    "extract_json_from_text",
    "load_env_file",
]

