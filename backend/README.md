# Local Backend (FastAPI + SQLite)

This backend stores uploaded PDFs and extracted invoices locally and exposes an API for the React dashboard.

## Prerequisites

- Python **3.12+** recommended
- (Windows) PowerShell

## Install

```powershell
cd "h:\RAG New\backend"
python -m venv .venv
.\.venv\Scripts\activate
python -m pip install -r requirements.txt
```

## Configure

### Gemini API key

Create or update:

- `h:\RAG New\invoice_extractor\.env`

with:

```text
GEMINI_API_KEY=your_key_here
```

The backend auto-loads this file at startup.

### Performance tuning (optional)

Set env vars (defaults shown):

```text
INVOICE_EXTRACT_DPI=200
INVOICE_RETRY_DPI=300
INVOICE_PAGE_CONCURRENCY=3
INVOICE_PAGE_TIMEOUT_S=180
INVOICE_BIG_PDF_PAGES=10
INVOICE_BIG_PDF_BYTES=8388608
INVOICE_VLM_BATCH_SIZE=3
INVOICE_VLM_IMAGE_FORMAT=jpeg
```

## Run

```powershell
cd "h:\RAG New\backend"
.\.venv\Scripts\activate
python -m uvicorn app.main:app --port 8000
```

Backend runs at `http://127.0.0.1:8000`.

## Data locations

- SQLite DB: `backend/data/app.db`
- Uploaded PDFs: `backend/storage/`

To reset everything for a clean test:

1. Stop the backend
2. Delete:
   - `backend/data/app.db`
   - `backend/storage/*.pdf`
3. Start the backend again (tables are recreated on startup)

## API endpoints (high level)

- **Upload a PDF (background job)**: `POST /api/documents` (multipart form field: `file`)
- **Job status/progress**: `GET /api/jobs/{job_id}` and `GET /api/jobs?limit=50`
- **List invoices**: `GET /api/invoices`
- **List AI Review queue**: `GET /api/ai-review`
- **Invoice detail**: `GET /api/invoices/{invoice_id}`
- **Update invoice (approve/edit)**: `PUT /api/invoices/{invoice_id}`
- **Excel export**: `GET /api/invoices/export.xlsx`
- **Document viewer**: `GET /api/documents/{document_id}/file`

## AI scoring & “low confidence” (how it works)

The system tracks two confidence signals:

- **`model_avg_confidence` (0..1)**: the VLM’s self-reported average across per-field confidences.
- **`system_confidence` (0..1)**: a conservative score computed after “no-guess” gating + deterministic checks.

The UI should display **system confidence first** and only **fallback to model** if system is missing.

### Field-level “low confidence”

- The extractor asks the model for `quality.field_confidence[field]` (0..1).
- If a **mandatory** field has confidence \< **0.7**, it is treated as low-confidence and forced to **null** (no guessing).

Mandatory fields are controlled in `invoice_extractor/lib.py` (`MANDATORY_FIELDS`).

### System confidence calculation (summary)

In `invoice_extractor/lib.py`:

- Start at 1.0
- Penalize missing key fields (e.g. `Invoice_No`, `Invoice_Date`, `Net_Amount`, `Exclusive_Value`, `Inclusive_Value`)
- Penalize totals mismatch (Inclusive vs Exclusive + GST)
- If any fields are forced null due to unreadable/low-confidence: clamp to **0.4**

### Rescan / reupload recommendations

- `needs_rescan=true` is reserved for **true readability** problems (blurry/faded/cut-off/unreadable),
  not for fields that are simply absent on the invoice.

