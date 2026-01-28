# AI Invoice Intelligence (Demo - Cloud Deployment Ready)

End-to-end invoice processing application with AI-powered extraction:

- Uploading PDFs (single or multi-page)
- Extracting invoice fields using Gemini VLM with a strict **no-hallucination** policy
- Reviewing/approving invoices in a React dashboard
- Exporting the current invoice list to Excel (backend-generated `.xlsx`)

## 🚀 Quick Start - Cloud Deployment

**This version is optimized for demo deployment with:**
- ✅ No authentication required (demo mode)
- ✅ In-memory storage (no database setup needed)
- ✅ Ready to deploy on Render (backend) + Vercel (frontend)

**👉 [See Full Deployment Guide](./DEPLOYMENT_GUIDE.md)**

### Live Demo Features

All the original features work perfectly:
- ✅ PDF upload and processing
- ✅ AI-powered extraction with Gemini
- ✅ Real-time job progress tracking
- ✅ Invoice review and editing
- ✅ Excel export
- ✅ Supplier and buyer management

⚠️ **Note:** Data is stored in memory and resets on server restart (perfect for demos!)

---

## Project structure

- `backend/`: FastAPI backend with in-memory storage
- `invoice_extractor/`: shared extraction library (`lib.py`)
- `AI Invoice Intelligence Dashboard/`: React (Vite) frontend

## Prerequisites (for local development)

- Node.js 18+ (for the frontend)
- Python 3.12+ (recommended)
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

## Local Development Setup

### 1) Configure API key

Create `invoice_extractor/.env`:

```text
GEMINI_API_KEY=your_key_here
```

### 2) Run the backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend: `http://127.0.0.1:8000`
API Docs: `http://127.0.0.1:8000/docs`

### 3) Run the frontend

```powershell
cd "AI Invoice Intelligence Dashboard"
npm install
npm run dev
```

Frontend: `http://127.0.0.1:5173`

---

## Deployment (Production/Demo)

### Option 1: Full Deployment (Recommended)

Deploy to cloud platforms for a public demo:

**Backend:** Render.com (free tier)
**Frontend:** Vercel (free tier)

**👉 [Complete Step-by-Step Deployment Guide](./DEPLOYMENT_GUIDE.md)**

### Option 2: Local Demo

Follow the "Local Development Setup" above for testing on your machine.

---

## Key Changes from Original

This demo version has been modified for easy cloud deployment:

### Backend Changes
- ✅ Replaced SQLite with in-memory storage (`memory_store.py`)
- ✅ Removed authentication requirements
- ✅ CORS configured for all origins (demo-safe)
- ✅ Added Render deployment configs

### Frontend Changes
- ✅ Simplified login (direct dashboard access)
- ✅ Added environment variable support for API URL
- ✅ Added Vercel deployment config
- ✅ Updated UI to indicate demo mode

### What Still Works
- ✅ Full PDF upload and processing
- ✅ Gemini AI extraction
- ✅ Multi-page PDF support
- ✅ Invoice review workflow
- ✅ Excel export
- ✅ All original UI features

### What's Different
- ⚠️ No user authentication (demo mode)
- ⚠️ No database persistence (data in memory)
- ⚠️ Data resets on server restart
- ⚠️ Single session (not multi-tenant)

---

## Original Database Version

If you need the full version with SQLite database and authentication:

1. The original code is backed up in `backend/app/main_with_db.py.bak`
2. Restore it by renaming back to `main.py`
3. The database schema is in `backend/app/db.py`

---

## Architecture

### Frontend (React + Vite)
- Modern React with TypeScript
- shadcn/ui components
- Tailwind CSS styling
- Real-time job status updates
- PDF.js for document viewing

### Backend (FastAPI)
- Async Python API
- In-memory session storage
- File-based PDF storage
- RESTful endpoints
- Auto-generated API docs

### AI Extraction (Gemini VLM)
- Google Gemini 2.0 Flash
- 20 standardized invoice fields
- Confidence scoring
- Automatic retry with higher DPI
- Batch processing support

---

## Environment Variables (Production)

### Backend (Render)
```
GEMINI_API_KEY=your_actual_api_key
PYTHON_VERSION=3.12.0
INVOICE_EXTRACT_DPI=200
INVOICE_RETRY_DPI=300
INVOICE_PAGE_CONCURRENCY=3
INVOICE_PAGE_TIMEOUT_S=180
```

### Frontend (Vercel)
```
VITE_API_BASE_URL=https://your-backend.onrender.com
```

---

## API Endpoints

All endpoints are documented at `/docs` when running the backend.

Key endpoints:
- `POST /api/documents` - Upload PDF
- `GET /api/jobs/{job_id}` - Check extraction status
- `GET /api/invoices` - List all invoices
- `GET /api/invoices/{id}` - Get invoice detail
- `PUT /api/invoices/{id}` - Update invoice
- `GET /api/invoices/export.xlsx` - Export to Excel
- `GET /api/ai-review` - List invoices needing review

---

## License

This is a demonstration project. For production use, please ensure you have appropriate licenses for all dependencies.

---

## Support & Issues

For deployment help, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

For issues:
1. Check the troubleshooting section in the deployment guide
2. Review backend logs in Render dashboard
3. Check browser console for frontend errors
4. Verify environment variables are set correctly

---

**Ready to deploy? Start with the [Deployment Guide](./DEPLOYMENT_GUIDE.md)! 🚀**


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

