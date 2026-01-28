# Pre-Deployment Checklist

Complete this checklist before deploying to ensure everything is ready.

## ✅ Code Preparation

- [x] Backend refactored to use in-memory storage
- [x] Frontend updated with demo login
- [x] API service configured for environment variables
- [x] Shell scripts created with Unix line endings
- [x] Configuration files created (render.yaml, vercel.json)
- [ ] All changes committed to Git
- [ ] Repository pushed to GitHub

## ✅ API Keys & Accounts

- [ ] Google Gemini API key obtained from https://aistudio.google.com/app/apikey
- [ ] GitHub account created/accessible
- [ ] Render account created at https://render.com
- [ ] Vercel account created at https://vercel.com

## ✅ Local Testing (Recommended)

### Backend Test
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- [ ] Backend starts without errors
- [ ] Visit http://127.0.0.1:8000/docs shows API documentation
- [ ] Can see all endpoints listed

### Frontend Test
```powershell
cd "AI Invoice Intelligence Dashboard"
npm install
npm run dev
```
- [ ] Frontend starts without errors
- [ ] Visit http://localhost:5173 shows login page
- [ ] Can click "Enter Demo Dashboard"
- [ ] Dashboard loads successfully

### Integration Test
- [ ] Upload a sample PDF invoice
- [ ] Extraction job starts and completes
- [ ] Invoice appears in invoices list
- [ ] Can view invoice details
- [ ] Can export to Excel

## ✅ Git Repository Setup

```powershell
cd "D:\AI_Invoice_Checker"
git init
git add .
git commit -m "Initial commit - Demo deployment ready"
```

- [ ] Git initialized
- [ ] All files committed
- [ ] GitHub repository created
- [ ] Remote added: `git remote add origin https://github.com/YOUR_USERNAME/ai-invoice-checker.git`
- [ ] Code pushed: `git push -u origin main`

## ✅ Backend Deployment (Render)

1. **Create Web Service**
   - [ ] Logged into Render
   - [ ] Connected GitHub repository
   - [ ] Selected correct repository

2. **Configuration**
   - [ ] Name: `invoice-backend` (or your choice)
   - [ ] Root Directory: `backend`
   - [ ] Runtime: `Python 3`
   - [ ] Build Command: `./build.sh`
   - [ ] Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - [ ] Instance Type: Free

3. **Environment Variables**
   - [ ] `GEMINI_API_KEY` = (your actual API key)
   - [ ] `PYTHON_VERSION` = 3.12.0
   - [ ] `INVOICE_EXTRACT_DPI` = 200
   - [ ] `INVOICE_RETRY_DPI` = 300
   - [ ] `INVOICE_PAGE_CONCURRENCY` = 3
   - [ ] `INVOICE_PAGE_TIMEOUT_S` = 180

4. **Deployment**
   - [ ] Clicked "Create Web Service"
   - [ ] Build completed successfully
   - [ ] Service is running
   - [ ] Backend URL copied (e.g., https://invoice-backend-xxxx.onrender.com)

5. **Verification**
   - [ ] Visit backend-url/docs shows API documentation
   - [ ] No errors in Render logs
   - [ ] Health check passes

## ✅ Frontend Deployment (Vercel)

1. **Import Project**
   - [ ] Logged into Vercel
   - [ ] Imported GitHub repository
   - [ ] Vite framework detected

2. **Configuration**
   - [ ] Root Directory: `AI Invoice Intelligence Dashboard`
   - [ ] Framework Preset: Vite
   - [ ] Build Command: `npm run build`
   - [ ] Output Directory: `dist`
   - [ ] Install Command: `npm install`

3. **Environment Variables**
   - [ ] `VITE_API_BASE_URL` = (your Render backend URL, no trailing slash)

4. **Deployment**
   - [ ] Clicked "Deploy"
   - [ ] Build completed successfully
   - [ ] Site is live
   - [ ] Frontend URL received (e.g., https://ai-invoice-checker.vercel.app)

5. **Verification**
   - [ ] Visit frontend URL
   - [ ] Login page loads correctly
   - [ ] Shows "Demo Mode" message
   - [ ] No console errors

## ✅ End-to-End Testing

- [ ] Click "Enter Demo Dashboard"
- [ ] Dashboard page loads with stats
- [ ] Navigate to "Upload" page
- [ ] Upload a sample PDF invoice
- [ ] See job progress in real-time
- [ ] Job completes successfully
- [ ] Navigate to "Invoices" page
- [ ] See extracted invoice in list
- [ ] Click on invoice to view details
- [ ] PDF viewer loads document
- [ ] Can edit invoice fields
- [ ] Can approve invoice
- [ ] Navigate to "Export" or click export button
- [ ] Excel file downloads successfully
- [ ] Open Excel file and verify data

## ✅ Performance Check

- [ ] Backend responds within 5 seconds (first request may be slower)
- [ ] Frontend loads within 3 seconds
- [ ] Page navigation is instant
- [ ] Upload works for PDFs up to 10MB
- [ ] Multi-page PDFs process correctly
- [ ] No memory errors in logs

## ✅ Security Check

- [ ] GEMINI_API_KEY not exposed in frontend code
- [ ] No sensitive data in client-side logs
- [ ] HTTPS enabled on both domains
- [ ] Environment variables set correctly
- [ ] No API keys committed to Git

## ✅ Documentation Check

- [ ] README.md updated with deployment info
- [ ] DEPLOYMENT_GUIDE.md reviewed
- [ ] QUICK_START.md available
- [ ] CHANGES_SUMMARY.md documents modifications
- [ ] All links in documentation work

## ✅ Optional: Custom Domain Setup

### Vercel (Frontend)
- [ ] Domain purchased/available
- [ ] Added domain in Vercel project settings
- [ ] DNS configured (A/CNAME records)
- [ ] SSL certificate generated
- [ ] Domain verified and working

### Render (Backend)
- [ ] Custom domain purchased (if desired)
- [ ] Added in Render service settings
- [ ] DNS configured
- [ ] SSL certificate generated
- [ ] Update VITE_API_BASE_URL in Vercel with new domain
- [ ] Redeploy frontend

## ✅ Post-Deployment

- [ ] Share demo URL with stakeholders
- [ ] Monitor Render logs for first 24 hours
- [ ] Check Vercel analytics
- [ ] Test with real invoice documents
- [ ] Document any issues encountered
- [ ] Plan for production migration (if needed)

## 🎉 Success Criteria

All of the following should work:

1. ✅ User can access frontend URL
2. ✅ User can click "Enter Demo Dashboard"
3. ✅ User can upload PDF invoice
4. ✅ System extracts invoice data using Gemini AI
5. ✅ User can view extracted data
6. ✅ User can edit and approve invoices
7. ✅ User can export invoices to Excel
8. ✅ All data resets on backend restart (expected behavior)

## 📝 Notes

**Important Reminders:**
- Free tier backend sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- Data is not persistent (resets on restart)
- This is a DEMO version - not production-ready
- Monitor Gemini API quota usage

**Support:**
- Render issues: Check logs in Render dashboard
- Vercel issues: Check build logs in Vercel dashboard
- API issues: Check browser console
- Extraction issues: Verify Gemini API key and quota

## 🚀 Ready to Deploy?

If all boxes above are checked and local testing passed:
1. Start with Part 2 of DEPLOYMENT_GUIDE.md (Deploy Backend on Render)
2. Then proceed to Part 3 (Deploy Frontend on Vercel)
3. Follow Part 4 for verification

**Good luck with your deployment! 🎉**
