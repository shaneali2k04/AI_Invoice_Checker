# Deployment Guide: AI Invoice Intelligence Dashboard

This guide will walk you through deploying your application:
- **Backend** on Render (FastAPI with in-memory storage)
- **Frontend** on Vercel (React + Vite)

## Prerequisites

1. **Accounts:**
   - GitHub account (to host your code)
   - [Render account](https://render.com) (free tier available)
   - [Vercel account](https://vercel.com) (free tier available)
   - Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

2. **Local Setup:**
   - Git installed on your machine
   - Node.js 18+ installed
   - Python 3.12+ installed

---

## Part 1: Prepare Your Repository

### Step 1: Initialize Git Repository

Open PowerShell and navigate to your project:

```powershell
cd "D:\AI_Invoice_Checker"
git init
```

### Step 2: Create .gitignore

Create a `.gitignore` file in the root directory:

```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
.venv/
venv/
ENV/
backend/data/
backend/storage/

# Environment variables
.env
.env.local
.env.*.local

# Node
node_modules/
dist/
dist-ssr/
*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

### Step 3: Commit Your Code

```powershell
git add .
git commit -m "Initial commit - Demo deployment ready"
```

### Step 4: Push to GitHub

1. Go to [GitHub](https://github.com) and create a new repository named `ai-invoice-checker`
2. **Don't** initialize with README, .gitignore, or license (we already have these)
3. Copy the commands GitHub shows you:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/ai-invoice-checker.git
git branch -M main
git push -u origin main
```

---

## Part 2: Deploy Backend on Render

### Step 1: Sign Up / Log In to Render

1. Go to [render.com](https://render.com)
2. Sign up or log in (you can use your GitHub account)

### Step 2: Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub account if not already connected
3. Select your `ai-invoice-checker` repository
4. Click **"Connect"**

### Step 3: Configure the Web Service

Fill in the following settings:

**Basic Settings:**
- **Name:** `invoice-backend` (or any name you prefer)
- **Region:** Choose closest to your location (e.g., `Oregon (US West)`)
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** `Python 3`

**Build & Deploy:**
- **Build Command:** `./build.sh`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Instance Type:**
- Select **"Free"** (or upgrade if needed)

### Step 4: Add Environment Variables

Scroll down to **"Environment Variables"** section and add:

| Key | Value |
|-----|-------|
| `GEMINI_API_KEY` | `your-actual-gemini-api-key-here` |
| `PYTHON_VERSION` | `3.12.0` |
| `INVOICE_EXTRACT_DPI` | `200` |
| `INVOICE_RETRY_DPI` | `300` |
| `INVOICE_PAGE_CONCURRENCY` | `3` |
| `INVOICE_PAGE_TIMEOUT_S` | `180` |

**Important:** Replace `your-actual-gemini-api-key-here` with your real Gemini API key.

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Wait for the build to complete (5-10 minutes for first deployment)
3. Once deployed, you'll see a URL like: `https://invoice-backend-xxxx.onrender.com`
4. **Copy this URL** - you'll need it for the frontend!

### Step 6: Test the Backend

Visit `https://your-backend-url.onrender.com/docs` to see the API documentation (FastAPI auto-generates this).

---

## Part 3: Deploy Frontend on Vercel

### Step 1: Sign Up / Log In to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up or log in (you can use your GitHub account)

### Step 2: Import Project

1. Click **"Add New..."** → **"Project"**
2. Import your `ai-invoice-checker` repository from GitHub
3. Vercel will automatically detect it's a Vite project

### Step 3: Configure the Project

**Framework Preset:** Vite (should be auto-detected)

**Root Directory:** 
- Click **"Edit"** next to Root Directory
- Enter: `AI Invoice Intelligence Dashboard`
- Click **"Continue"**

**Build Settings:**
- **Build Command:** `npm run build` (should be auto-filled)
- **Output Directory:** `dist` (should be auto-filled)
- **Install Command:** `npm install` (should be auto-filled)

### Step 4: Add Environment Variable

This is **CRITICAL** - without this, your frontend won't connect to the backend!

In the **"Environment Variables"** section, add:

| Name | Value |
|------|-------|
| `VITE_API_BASE_URL` | `https://invoice-backend-xxxx.onrender.com` |

**Replace** the URL with your actual Render backend URL from Part 2, Step 5.

⚠️ **Important:** Do NOT add a trailing slash at the end of the URL.

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (2-5 minutes)
3. Once deployed, you'll get a URL like: `https://ai-invoice-checker.vercel.app`

### Step 6: Test the Application

1. Visit your Vercel URL
2. You should see the demo login page
3. Click **"Enter Demo Dashboard"**
4. You should be able to:
   - Upload PDF invoices
   - See extraction progress
   - View extracted invoices
   - Export to Excel

---

## Part 4: Verify Everything Works

### Backend Health Check

1. Visit `https://your-backend-url.onrender.com/docs`
2. You should see FastAPI's Swagger UI documentation
3. Try the `/api/jobs` endpoint - it should return an empty array `[]`

### Frontend Health Check

1. Visit your Vercel frontend URL
2. Click "Enter Demo Dashboard"
3. Navigate to "Upload" page
4. Try uploading a sample PDF invoice
5. Watch the job progress in real-time
6. Check if invoice data appears in the "Invoices" page

### Common Issues & Solutions

**Backend shows 503 error when uploading:**
- Check if `GEMINI_API_KEY` is correctly set in Render environment variables
- Verify your API key is valid by testing it at [Google AI Studio](https://aistudio.google.com/)

**Frontend can't connect to backend:**
- Check if `VITE_API_BASE_URL` environment variable is set correctly in Vercel
- Make sure there's no trailing slash in the URL
- Check browser console for CORS errors (backend should allow all origins in demo mode)

**Render deployment fails:**
- Check the build logs in Render dashboard
- Ensure `build.sh` has proper line endings (LF, not CRLF) - run in Git Bash: `dos2unix backend/build.sh backend/start.sh`
- Verify all dependencies are in `requirements.txt`

---

## Part 5: Post-Deployment Configuration

### Update CORS in Backend (if needed)

The demo backend allows all origins (`allow_origins=["*"]`). If you want to restrict it:

Edit `backend/app/main.py` line ~96:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-url.vercel.app"],  # Your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then commit and push to trigger redeployment.

### Monitor Your Application

**Render Dashboard:**
- View logs: Go to your service → "Logs" tab
- Monitor usage: Check "Metrics" tab
- Auto-deploy: Enabled by default on push to `main` branch

**Vercel Dashboard:**
- View deployments: Go to your project → "Deployments" tab
- Check analytics: "Analytics" tab (shows page views, performance)
- Auto-deploy: Enabled by default on push to `main` branch

---

## Part 6: Important Notes for Demo Mode

### Data Persistence

⚠️ **All data is stored in memory and will be lost when:**
- The Render backend restarts (free tier sleeps after 15 minutes of inactivity)
- You redeploy the backend
- The server crashes or restarts

This is intentional for the demo. If you need persistence, you'll need to:
1. Add a database (PostgreSQL, MongoDB, etc.)
2. Revert to the original database code in `main_with_db.py.bak`
3. Configure database connection in Render

### API Rate Limits

- Google Gemini API has rate limits (free tier: 15 RPM, 1 million TPM)
- If you hit limits, extraction will retry automatically with backoff
- Consider upgrading to paid tier for production use

### Render Free Tier Limitations

- Service sleeps after 15 minutes of inactivity
- First request after sleep takes ~30-60 seconds to wake up
- 750 hours/month free (enough for 24/7 if you have only one service)
- Consider upgrading to paid tier ($7/month) for always-on service

### Storage Limitations

- Uploaded PDFs are stored in `/opt/render/project/src/backend/storage/`
- Render's ephemeral filesystem has limited space (~512MB for free tier)
- Files persist between requests but are lost on restart
- For production, use cloud storage (AWS S3, Cloudflare R2, etc.)

---

## Part 7: Making Updates

### Update Backend

1. Make changes to backend code locally
2. Test locally: `cd backend && uvicorn app.main:app --reload`
3. Commit and push:
   ```powershell
   git add backend/
   git commit -m "Update: description of changes"
   git push
   ```
4. Render will automatically rebuild and redeploy

### Update Frontend

1. Make changes to frontend code locally
2. Test locally: `cd "AI Invoice Intelligence Dashboard" && npm run dev`
3. Commit and push:
   ```powershell
   git add "AI Invoice Intelligence Dashboard/"
   git commit -m "Update: description of changes"
   git push
   ```
4. Vercel will automatically rebuild and redeploy

### Update Environment Variables

**Render:**
1. Go to your service dashboard
2. Click "Environment" in left sidebar
3. Update/add variables
4. Click "Save Changes"
5. Service will automatically redeploy

**Vercel:**
1. Go to your project settings
2. Click "Environment Variables"
3. Update/add variables
4. Trigger redeploy: Go to "Deployments" → Click "..." → "Redeploy"

---

## Part 8: Troubleshooting Commands

### Check Backend Logs

In Render dashboard:
- Go to your service → "Logs" tab
- Or use Render CLI: `render logs -s invoice-backend`

### Check Frontend Build Logs

In Vercel dashboard:
- Go to project → "Deployments" → Click on deployment → "View Build Logs"

### Test Backend Locally

```powershell
cd "D:\AI_Invoice_Checker\backend"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Visit: http://127.0.0.1:8000/docs

### Test Frontend Locally

```powershell
cd "D:\AI_Invoice_Checker\AI Invoice Intelligence Dashboard"
npm install
npm run dev
```

Visit: http://localhost:5173

### Fix Line Endings (if deployment fails)

If you get errors about shell scripts, fix line endings:

```powershell
# In Git Bash (not PowerShell)
cd /d/AI_Invoice_Checker/backend
dos2unix build.sh start.sh
git add build.sh start.sh
git commit -m "Fix: line endings for shell scripts"
git push
```

Or in PowerShell:

```powershell
cd "D:\AI_Invoice_Checker\backend"
(Get-Content build.sh -Raw) -replace "`r`n", "`n" | Set-Content build.sh -NoNewline
(Get-Content start.sh -Raw) -replace "`r`n", "`n" | Set-Content start.sh -NoNewline
git add build.sh start.sh
git commit -m "Fix: line endings for shell scripts"
git push
```

---

## Part 9: Cost Breakdown

### Free Tier (Recommended for Demo)

**Render Free:**
- ✅ 750 hours/month
- ✅ Auto-sleep after 15 min inactivity
- ✅ 512MB RAM
- ⚠️ Shared CPU
- ⚠️ Service sleeps when inactive

**Vercel Free:**
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ No credit card required

**Google Gemini Free:**
- ✅ 15 requests/minute
- ✅ 1 million tokens/minute
- ✅ 1,500 requests/day

**Total: $0/month**

### Paid Tier (For Production)

**Render Starter ($7/month):**
- Always-on (no sleep)
- 512MB RAM
- Dedicated CPU share

**Vercel Pro ($20/month):**
- 1TB bandwidth
- Priority support
- Advanced analytics

**Google Gemini Paid (Pay as you go):**
- 360 requests/minute
- $0.00025 per 1K characters input
- $0.00075 per 1K characters output

**Estimated Total: ~$27-50/month** (depending on usage)

---

## Part 10: Next Steps

### For Production Deployment

1. **Add Database:**
   - Use PostgreSQL on Render ($7/month)
   - Restore database code from `main_with_db.py.bak`
   - Update connection strings

2. **Add Cloud Storage:**
   - Use AWS S3 or Cloudflare R2 for PDF storage
   - Update file upload/download logic

3. **Add Authentication:**
   - Implement JWT tokens
   - Add user registration/login
   - Restore auth endpoints

4. **Add Monitoring:**
   - Set up Sentry for error tracking
   - Add application metrics
   - Configure alerts

5. **Improve Security:**
   - Add rate limiting
   - Implement API key rotation
   - Add input validation

### Useful Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Google Gemini API Documentation](https://ai.google.dev/docs)

---

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review deployment logs in Render/Vercel dashboards
3. Test locally to isolate the issue
4. Check browser console for frontend errors
5. Verify environment variables are set correctly

---

**Congratulations! Your AI Invoice Intelligence Dashboard is now live! 🎉**

Share your demo URL: `https://your-app.vercel.app`
