# Invoice Extractor (Gemini VLM + PDF)

This folder contains the shared extraction library used by the backend and any standalone scripts.

## Configure

Create `invoice_extractor/.env`:

```text
GEMINI_API_KEY=your_key_here
```

## What it extracts

The extractor returns a stable JSON shape containing:

- `data`: normalized invoice fields (missing/unreadable → `null`)
- `quality`: model-reported per-field confidence + diagnostics (used for gating)

Field list (exported as `INVOICE_FIELDS`) lives in `invoice_extractor/lib.py`.

## “No-guess” rules (important)

- If a value is **not readable** (blurry/faded/cut-off/unreadable), it is forced to **null**.
- If a **mandatory** field confidence is \< **0.7**, it is forced to **null**.
- **Handwritten is OK** if a value is readable (do not flag handwriting just because it is handwritten).
- `needs_rescan=true` is reserved for **true readability** problems, not for fields that are simply absent.

## Return field synonyms

The prompt asks the model to interpret common variants such as:

- `Return`, `RET`, `RT`, `RTN`, `SR`, `Sales Return`, `Less Return`, `Less RT`

If ambiguous, Return is set to `null` (no guessing).

## Run the standalone script (optional)

If you want to run extraction outside the backend:

```powershell
cd "h:\RAG Latest v1\invoice_extractor"
python extract_invoices.py
```

Note: the backend is the recommended way to run end-to-end (upload → jobs → UI → export).

