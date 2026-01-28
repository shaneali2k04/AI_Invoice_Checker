"""
In-memory storage for demo deployment (no database persistence).
All data is stored in Python dictionaries and will be lost on server restart.
"""

from typing import Any, Optional
from datetime import datetime, timezone
import json

# In-memory storage
documents_store: dict[str, dict] = {}
jobs_store: dict[str, dict] = {}
parties_store: dict[str, dict] = {}
invoices_store: dict[str, dict] = {}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def dumps(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=False)


def loads(s: Optional[str]) -> Any:
    if not s:
        return None
    return json.loads(s)


def init_store() -> None:
    """Initialize in-memory storage (no-op for demo)"""
    pass


def clear_all_data() -> None:
    """Clear all data from memory"""
    documents_store.clear()
    jobs_store.clear()
    parties_store.clear()
    invoices_store.clear()


# Document operations
def create_document(doc_id: str, filename: str, stored_path: str) -> None:
    documents_store[doc_id] = {
        "id": doc_id,
        "filename": filename,
        "stored_path": stored_path,
        "created_at": _now_iso(),
    }


def get_document(doc_id: str) -> Optional[dict]:
    return documents_store.get(doc_id)


# Job operations
def create_job(job_id: str, document_id: str) -> None:
    jobs_store[job_id] = {
        "id": job_id,
        "document_id": document_id,
        "status": "queued",
        "total_pages": None,
        "processed_pages": 0,
        "message": None,
        "error": None,
        "invoice_ids": [],
        "has_low_readability": False,
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
    }


def update_job(
    job_id: str,
    status: Optional[str] = None,
    total_pages: Optional[int] = None,
    processed_pages: Optional[int] = None,
    message: Optional[str] = None,
    error: Optional[str] = None,
    invoice_ids: Optional[list[str]] = None,
    has_low_readability: Optional[bool] = None,
) -> None:
    if job_id not in jobs_store:
        return
    
    job = jobs_store[job_id]
    if status is not None:
        job["status"] = status
    if total_pages is not None:
        job["total_pages"] = total_pages
    if processed_pages is not None:
        job["processed_pages"] = processed_pages
    if message is not None:
        job["message"] = message
    if error is not None:
        job["error"] = error
    if invoice_ids is not None:
        job["invoice_ids"] = invoice_ids.copy()
    if has_low_readability is not None:
        job["has_low_readability"] = has_low_readability
    
    job["updated_at"] = _now_iso()


def get_job(job_id: str) -> Optional[dict]:
    job = jobs_store.get(job_id)
    if not job:
        return None
    
    # Enrich with document filename
    doc = get_document(job["document_id"])
    if doc:
        return {**job, "filename": doc["filename"]}
    return job


def list_jobs(limit: int = 50) -> list[dict]:
    """List jobs sorted by created_at descending"""
    jobs = list(jobs_store.values())
    jobs.sort(key=lambda x: x["created_at"], reverse=True)
    
    # Enrich with document filenames
    result = []
    for job in jobs[:limit]:
        doc = get_document(job["document_id"])
        if doc:
            result.append({**job, "filename": doc["filename"]})
        else:
            result.append(job)
    
    return result


# Party operations
def upsert_party(
    party_type: str,
    name: Optional[str],
    ntn: Optional[str],
    gst_no: Optional[str],
    registration_no: Optional[str],
) -> str:
    """
    Simplified party upsert - matches by NTN or registration number.
    Returns party_id.
    """
    import uuid
    
    # Normalize identifiers
    ntn_norm = (ntn or "").strip().upper() if ntn else None
    reg_norm = (registration_no or "").strip().upper() if registration_no else None
    
    # Find existing party by identifier
    for party in parties_store.values():
        if party["type"] != party_type:
            continue
        if ntn_norm and party.get("ntn_norm") == ntn_norm:
            # Update with new info
            if name:
                party["name_raw"] = name
            if gst_no:
                party["gst_raw"] = gst_no
            if registration_no:
                party["registration_raw"] = registration_no
                party["registration_norm"] = reg_norm
            party["updated_at"] = _now_iso()
            return party["id"]
        if reg_norm and party.get("registration_norm") == reg_norm:
            # Update with new info
            if name:
                party["name_raw"] = name
            if ntn:
                party["ntn_raw"] = ntn
                party["ntn_norm"] = ntn_norm
            if gst_no:
                party["gst_raw"] = gst_no
            party["updated_at"] = _now_iso()
            return party["id"]
    
    # Create new party
    party_id = uuid.uuid4().hex
    parties_store[party_id] = {
        "id": party_id,
        "type": party_type,
        "name_raw": name,
        "ntn_raw": ntn,
        "ntn_norm": ntn_norm,
        "gst_raw": gst_no,
        "registration_raw": registration_no,
        "registration_norm": reg_norm,
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
    }
    
    return party_id


def get_party(party_id: str) -> Optional[dict]:
    return parties_store.get(party_id)


# Invoice operations
def create_invoice(
    invoice_id: str,
    document_id: str,
    page_no: int,
    supplier_party_id: Optional[str],
    buyer_party_id: Optional[str],
    extracted_data: dict,
    status: str,
    needs_rescan: bool,
    unreadable_fields: list,
    reasons: list,
    model_avg_confidence: Optional[float],
    system_confidence: Optional[float],
    system_reasons: list,
    field_diagnostics: dict,
) -> None:
    invoices_store[invoice_id] = {
        "id": invoice_id,
        "document_id": document_id,
        "page_no": page_no,
        "supplier_party_id": supplier_party_id,
        "buyer_party_id": buyer_party_id,
        "extracted_json": dumps(extracted_data),
        "edited_json": None,
        "status": status,
        "needs_rescan": needs_rescan,
        "unreadable_fields_json": dumps(unreadable_fields),
        "reasons_json": dumps(reasons),
        "model_avg_confidence": model_avg_confidence,
        "system_confidence": system_confidence,
        "system_reasons_json": dumps(system_reasons),
        "field_diagnostics_json": dumps(field_diagnostics),
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
    }


def get_invoice(invoice_id: str) -> Optional[dict]:
    return invoices_store.get(invoice_id)


def list_invoices(limit: int = 1000, status_filter: Optional[str] = None) -> list[dict]:
    """List all invoices with optional status filter"""
    invoices = list(invoices_store.values())
    
    if status_filter:
        invoices = [inv for inv in invoices if inv["status"] == status_filter]
    
    # Sort by created_at descending
    invoices.sort(key=lambda x: x["created_at"], reverse=True)
    
    return invoices[:limit]


def update_invoice(
    invoice_id: str,
    edited_data: Optional[dict] = None,
    status: Optional[str] = None,
) -> None:
    if invoice_id not in invoices_store:
        return
    
    invoice = invoices_store[invoice_id]
    if edited_data is not None:
        invoice["edited_json"] = dumps(edited_data)
    if status is not None:
        invoice["status"] = status
    
    invoice["updated_at"] = _now_iso()


def delete_invoice(invoice_id: str) -> None:
    if invoice_id in invoices_store:
        del invoices_store[invoice_id]
