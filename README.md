# AI Invoice Intelligence (Local)

End-to-end local app for:

- Uploading PDFs (single or multi-page)
- Extracting invoice fields using Gemini VLM with a strict **no-hallucination** policy
- Reviewing/approving invoices in a React dashboard
- Exporting the current invoice list to Excel (backend-generated `.xlsx`)

## Project structure

- `backend/`: FastAPI backend + SQLite + file storage
- `invoice_extractor/`: shared extraction library (`lib.py`)
- `AI Invoice Intelligence Dashboard/`: React (Vite) frontend

## Prerequisites

- Node.js 18+ (for the frontend)
- Python 3.12+ (recommended)

## 1) Configure API key

Create `invoice_extractor/.env`:

```text
GEMINI_API_KEY=your_key_here
```

## 2) Run the backend

```powershell
cd "h:\RAG Latest v1\backend"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Backend: `http://127.0.0.1:8000`

## 3) Run the frontend

```powershell
cd "h:\RAG Latest v1\AI Invoice Intelligence Dashboard"
npm install
npm run dev -- --host 127.0.0.1 --port 3000
```

Frontend: `http://127.0.0.1:3000`

The Vite dev server proxies `/api/*` to the backend.

Notes:
- Max upload size (client-side): **12MB per file**.

## Excel export

From the Invoice list page, click **Export**.

This calls the backend endpoint:

- `GET /api/invoices/export.xlsx`

which downloads a backend-generated `.xlsx`.

## Confidence / scoring (summary)

Two signals exist:

- **Model confidence** (`model_avg_confidence`, 0..1): self-reported average across field confidences.
- **System confidence** (`system_confidence`, 0..1): conservative score after gating + validations.

Recommended display: **system first**, fallback to model only when system is missing.

Field-level “low confidence”:

- If a **mandatory** field confidence \< **0.7**, the value is forced to **null** (no guessing).

## Clean reset (wipe DB and uploads)

1. Stop the backend
2. Delete:
   - `backend/data/app.db`
   - `backend/storage/*.pdf`
3. Start the backend again

## Deployment (Cloudflare Pages + Render)

This repo is split into:

- **Frontend**: `AI Invoice Intelligence Dashboard/` (static build)
- **Backend**: `backend/` (FastAPI)

### Frontend (Cloudflare Pages)

- **Build command**: `npm run build`
- **Output directory**: `build`

Recommended: configure an env var for the backend base URL, e.g.:

- `VITE_API_BASE_URL=https://<your-render-app>.onrender.com`

Then the frontend should call `VITE_API_BASE_URL + /api/...` in production (instead of relying on local Vite proxy).

### Backend (Render)

- **Start command**:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

- **Environment variables**:
  - `GEMINI_API_KEY=...`

### Storage note (important)

The backend stores:

- SQLite DB: `backend/data/app.db`
- Uploaded PDFs: `backend/storage/*.pdf`

For production reliability, plan to move PDFs to object storage (e.g. Cloudflare R2) and/or migrate DB to a managed database (Postgres).

