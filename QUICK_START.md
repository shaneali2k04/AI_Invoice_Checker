# Quick Deployment Reference

## 🎯 Step-by-Step Checklist

### Pre-Deployment
- [ ] Get Gemini API key from https://aistudio.google.com/app/apikey
- [ ] Create GitHub account (if needed)
- [ ] Create Render account at https://render.com
- [ ] Create Vercel account at https://vercel.com

### 1. Push to GitHub (5 minutes)
```powershell
cd "D:\AI_Invoice_Checker"
git init
git add .
git commit -m "Initial commit"
# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/ai-invoice-checker.git
git push -u origin main
```

### 2. Deploy Backend on Render (10 minutes)
1. Go to https://render.com → New + → Web Service
2. Connect your GitHub repo
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `./build.sh`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `GEMINI_API_KEY` = your-api-key
   - `PYTHON_VERSION` = 3.12.0
5. Click "Create Web Service"
6. Copy your backend URL (e.g., https://invoice-backend-xxxx.onrender.com)

### 3. Deploy Frontend on Vercel (5 minutes)
1. Go to https://vercel.com → Add New → Project
2. Import your GitHub repo
3. Configure:
   - **Root Directory:** `AI Invoice Intelligence Dashboard`
   - **Framework:** Vite (auto-detected)
4. Add Environment Variable:
   - `VITE_API_BASE_URL` = your-render-backend-url
5. Click "Deploy"
6. Visit your app at https://your-app.vercel.app

## ✅ Verification
- [ ] Backend API docs: https://your-backend.onrender.com/docs
- [ ] Frontend loads: https://your-app.vercel.app
- [ ] Can click "Enter Demo Dashboard"
- [ ] Can upload a PDF invoice
- [ ] Can see extraction progress
- [ ] Can view extracted invoice data
- [ ] Can export to Excel

## 🔧 Common Issues

**"GEMINI_API_KEY not configured"**
→ Add environment variable in Render dashboard

**"Failed to fetch"**
→ Check VITE_API_BASE_URL in Vercel (no trailing slash!)

**Backend sleeping (15 min inactivity)**
→ Expected on free tier. First request after sleep takes ~30-60s

**Build fails with shell script errors**
→ Fix line endings: See DEPLOYMENT_GUIDE.md Part 8

## 📊 Free Tier Limits
- **Render:** 750 hours/month, sleeps after 15 min inactivity
- **Vercel:** 100GB bandwidth/month, unlimited deployments
- **Gemini:** 15 requests/min, 1.5K requests/day

## 🔄 Updating After Deployment
```powershell
git add .
git commit -m "Your changes"
git push
```
Both Render and Vercel auto-deploy on push to main branch.

## 🆘 Need Help?
See full guide: DEPLOYMENT_GUIDE.md
