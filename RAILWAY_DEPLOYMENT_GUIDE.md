# Railway Deployment Guide - Complete Implementation

## Complete Motor Premium Calculator - Railway Hosting

This guide provides step-by-step instructions to deploy both the **backend (FastAPI)** and **frontend (React)** to Railway.

---

## 🎯 Overview

**What we're deploying:**
- **Backend:** FastAPI application with premium calculator
- **Frontend:** React application with Material-UI
- **Storage:** JSON configuration files (no database needed)

**Railway Benefits:**
- Free tier available ($5 credit/month)
- Easy deployment from GitHub
- Automatic HTTPS
- Environment variables support
- Custom domains

---

## 📋 Prerequisites

1. **GitHub Account** - Your code repository
2. **Railway Account** - Sign up at [railway.app](https://railway.app)
3. **Repository Ready** - All code committed to GitHub

---

## Part 1: Backend Deployment (FastAPI)

### Step 1: Create Railway Project

1. **Login to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "Login" → Sign in with GitHub
   - Authorize Railway to access your repositories

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository: `nitarashankar/pvt-car-premium-calc`
   - Railway will detect it as a Python project

### Step 2: Configure Backend Service

1. **Set Root Directory** (if needed)
   - Go to Settings → Service Settings
   - Root Directory: Leave as `/` (root)

2. **Add Environment Variables**
   - Go to Variables tab
   - Add the following variables:
   
   ```
   PYTHON_VERSION=3.9
   PORT=8000
   PYTHONPATH=/app
   ```

3. **Configure Start Command**
   - Go to Settings → Deploy
   - Start Command: `uvicorn src.premium_calculator.api:app --host 0.0.0.0 --port $PORT`
   - Or Railway will use the `Procfile` automatically

### Step 3: Deploy Backend

1. **Trigger Deployment**
   - Railway automatically deploys when you push to GitHub
   - Or click "Deploy" manually in Railway dashboard

2. **Monitor Build**
   - Watch the build logs
   - Should see: "Installing dependencies from requirements.txt"
   - Should see: "Application startup complete"

3. **Get Backend URL**
   - Once deployed, Railway provides a URL
   - Example: `https://your-app-name.up.railway.app`
   - Click "Generate Domain" if not auto-generated
   - **Save this URL** - you'll need it for frontend

4. **Test Backend**
   ```bash
   # Health check
   curl https://your-app-name.up.railway.app/health
   
   # API documentation
   # Visit: https://your-app-name.up.railway.app/docs
   ```

### Step 4: Configure CORS for Frontend

The backend is already configured with CORS that allows all origins:

```python
# In src/premium_calculator/api.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

For production, update to specific frontend URL:
```python
allow_origins=["https://your-frontend.railway.app"],
```

---

## Part 2: Frontend Deployment (React)

### Step 1: Update Frontend API Configuration

1. **Create Environment File**
   
   Create `frontend/.env.production`:
   ```env
   REACT_APP_API_URL=https://your-backend.up.railway.app
   ```

2. **Update API Service**
   
   Edit `frontend/src/services/api.js`:
   ```javascript
   const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
   ```

### Step 2: Add Build Configuration

Create `frontend/package.json` build script (if not exists):
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "serve": "serve -s build -l $PORT"
  }
}
```

Add serve dependency:
```bash
cd frontend
npm install --save serve
```

### Step 3: Create Frontend Railway Project

**Option A: Same Repository (Monorepo)**

1. **Add New Service to Existing Project**
   - In Railway dashboard, click "New"
   - Select "Empty Service"
   - Name it "Frontend"

2. **Configure Service**
   - Settings → Source: Same GitHub repository
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `serve -s build -l $PORT`

**Option B: Deploy Frontend Separately**

1. **Create New Railway Project**
   - Click "New Project"
   - Deploy from same GitHub repo
   - This creates a separate project

2. **Configure as Above**

### Step 4: Set Environment Variables

In Frontend service Variables tab:
```
NODE_ENV=production
REACT_APP_API_URL=https://your-backend.up.railway.app
PORT=3000
```

### Step 5: Deploy Frontend

1. **Trigger Deployment**
   - Push to GitHub or click "Deploy"
   - Railway builds React app
   - Serves static files with `serve`

2. **Get Frontend URL**
   - Click "Generate Domain"
   - Example: `https://your-frontend.up.railway.app`

3. **Test Frontend**
   - Visit the URL in browser
   - Should see the calculator interface
   - Test a calculation
   - Try CSV upload

---

## Part 3: Complete Configuration

### Backend Updates for Production

1. **Update CORS in `src/premium_calculator/api.py`**
   ```python
   import os
   
   # Get frontend URL from environment
   FRONTEND_URL = os.getenv("FRONTEND_URL", "*")
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[FRONTEND_URL] if FRONTEND_URL != "*" else ["*"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. **Add Environment Variable in Railway**
   - Backend service → Variables
   - Add: `FRONTEND_URL=https://your-frontend.up.railway.app`

### Frontend Updates for Production

1. **Update `.env.production`**
   ```env
   REACT_APP_API_URL=https://your-backend.up.railway.app
   ```

2. **Rebuild Frontend**
   - Push changes to GitHub
   - Railway auto-deploys

---

## Part 4: File Upload Configuration

Railway has file size limits. For CSV processing:

1. **Backend:** Already configured for file uploads
2. **Increase Timeout (if needed):**
   
   In Railway:
   - Settings → Healthcheck → Timeout: 300 seconds

---

## Part 5: Monitoring & Logs

### View Logs

1. **Backend Logs**
   - Railway Dashboard → Backend Service → Logs
   - See API requests, errors, calculations

2. **Frontend Logs**
   - Railway Dashboard → Frontend Service → Logs
   - See build logs, serving status

### Monitoring

1. **Health Checks**
   - Backend: `https://backend.railway.app/health`
   - Check returns: `{"status": "healthy"}`

2. **Metrics**
   - Railway provides CPU, Memory, Network metrics
   - Dashboard → Metrics tab

---

## Part 6: Custom Domains (Optional)

### Add Custom Domain

1. **Backend Domain**
   - Railway → Backend Service → Settings
   - Click "Add Custom Domain"
   - Enter: `api.yourdomain.com`
   - Add CNAME record in your DNS:
     ```
     CNAME api.yourdomain.com → your-backend.up.railway.app
     ```

2. **Frontend Domain**
   - Same process for frontend
   - Enter: `calculator.yourdomain.com` or `yourdomain.com`

3. **Update Environment Variables**
   - Update REACT_APP_API_URL to use custom domain
   - Update CORS to allow custom frontend domain

---

## Part 7: Environment Variables Reference

### Backend Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `PYTHON_VERSION` | `3.9` | Python version |
| `PORT` | `8000` | Server port (auto-set by Railway) |
| `PYTHONPATH` | `/app` | Python module path |
| `FRONTEND_URL` | `https://your-frontend.railway.app` | CORS configuration |

### Frontend Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `NODE_ENV` | `production` | Build mode |
| `REACT_APP_API_URL` | `https://your-backend.railway.app` | API endpoint |
| `PORT` | `3000` | Server port |

---

## Part 8: Complete Deployment Checklist

### Backend ✅
- [ ] Repository connected to Railway
- [ ] Environment variables set
- [ ] Build successful
- [ ] Health endpoint responding
- [ ] API docs accessible (`/docs`)
- [ ] CORS configured
- [ ] Domain generated

### Frontend ✅
- [ ] Frontend service created
- [ ] Build command configured
- [ ] Environment variables set
- [ ] Build successful
- [ ] Static files serving
- [ ] Can access UI
- [ ] API calls working
- [ ] Domain generated

### Integration ✅
- [ ] Frontend can call backend API
- [ ] CORS allows requests
- [ ] Calculator works
- [ ] CSV upload/download works
- [ ] Config editor works

---

## Part 9: Testing Deployed Application

### Test Backend

```bash
# Health check
curl https://your-backend.railway.app/health

# Test calculation
curl -X POST https://your-backend.railway.app/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "cc_category": "1000cc_1500cc",
    "zone": "A",
    "purchase_date": "2024-01-01",
    "idv": 125000,
    "ncb_percent": 0.2
  }'
```

### Test Frontend

1. **Visit Frontend URL**
   - https://your-frontend.railway.app

2. **Test Calculator**
   - Fill in all fields
   - Click "Calculate Premium"
   - Verify results display

3. **Test CSV Upload**
   - Download CSV template
   - Upload sample CSV
   - Verify processing results
   - Download output CSV

4. **Test Config Editor**
   - View configurations
   - Edit a value
   - Save changes
   - Verify update

---

## Part 10: Troubleshooting

### Backend Issues

**Build Fails:**
```bash
# Check Python version
# Make sure requirements.txt is correct
# Verify Procfile or railway.json
```

**App Crashes:**
```bash
# Check logs in Railway dashboard
# Verify PYTHONPATH is set
# Check start command
```

**API Not Accessible:**
```bash
# Verify port binding: --host 0.0.0.0 --port $PORT
# Check domain is generated
# Test health endpoint
```

### Frontend Issues

**Build Fails:**
```bash
# Check package.json scripts
# Verify all dependencies installed
# Check build logs for errors
```

**API Calls Fail:**
```bash
# Verify REACT_APP_API_URL is correct
# Check CORS on backend
# Inspect browser console for errors
# Verify backend is running
```

**404 on Routes:**
```bash
# Ensure serve is configured for SPA
# serve -s build (single page app mode)
```

### CORS Issues

If you see CORS errors in browser:

1. **Check Backend CORS Config**
   ```python
   allow_origins=["https://your-frontend.railway.app"]
   ```

2. **Verify Frontend URL**
   - Must match exactly (no trailing slash)

3. **Check Railway Logs**
   - Backend logs show CORS requests

---

## Part 11: Cost & Scaling

### Railway Pricing

**Free Tier:**
- $5 credit/month
- Suitable for testing and small usage
- Services sleep after inactivity

**Paid Plans:**
- $5/month base + usage
- No sleeping
- Better performance
- Custom domains included

### Optimize Costs

1. **Use Single Service** (if possible)
   - Serve frontend from backend
   - Reduces service count

2. **Monitor Usage**
   - Check Railway dashboard
   - CPU, Memory, Network usage

3. **Configure Sleep**
   - Services sleep when inactive
   - Wakes on first request

---

## Part 12: Maintenance & Updates

### Update Application

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Update"
   git push origin main
   ```

2. **Railway Auto-Deploys**
   - Watches GitHub repository
   - Builds and deploys automatically

### Manual Deployment

1. **Trigger in Railway**
   - Dashboard → Service → Deploy
   - Select branch
   - Click "Deploy"

### Rollback

1. **View Deployments**
   - Dashboard → Deployments tab
   - See all previous deployments

2. **Rollback**
   - Click on previous deployment
   - Click "Redeploy"

---

## Part 13: Security Best Practices

### Environment Variables

- Never commit secrets to Git
- Use Railway environment variables
- Different values for dev/prod

### CORS Configuration

```python
# Production: Specific origins
allow_origins=["https://your-frontend.railway.app"]

# Development: All origins (only in dev)
allow_origins=["*"]
```

### API Rate Limiting

Consider adding rate limiting:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/calculate")
@limiter.limit("100/minute")
async def calculate_premium(input_data: PremiumInput):
    ...
```

---

## Part 14: Complete Example

### Example URLs

After deployment, you'll have:

**Backend:**
- URL: `https://pvt-car-calc-api.up.railway.app`
- Docs: `https://pvt-car-calc-api.up.railway.app/docs`
- Health: `https://pvt-car-calc-api.up.railway.app/health`

**Frontend:**
- URL: `https://pvt-car-calc.up.railway.app`
- Calculator: `https://pvt-car-calc.up.railway.app`

### Example Configuration

**Backend `railway.json`:**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn src.premium_calculator.api:app --host 0.0.0.0 --port $PORT"
  }
}
```

**Frontend Environment:**
```env
REACT_APP_API_URL=https://pvt-car-calc-api.up.railway.app
```

---

## 🎉 Deployment Complete!

Once both services are deployed:

✅ **Backend** serving API at Railway URL  
✅ **Frontend** accessible via Railway URL  
✅ **CSV Processing** working end-to-end  
✅ **All 86 Fields** supported  
✅ **Auto-deployment** from GitHub  

---

## 📞 Support Resources

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **Railway Status:** https://status.railway.app

---

## 📝 Quick Reference

### Deployment Commands

```bash
# Not needed - Railway deploys automatically from GitHub
# Just push to GitHub:
git push origin main
```

### Check Status

```bash
# Backend health
curl https://your-backend.railway.app/health

# Test calculation
curl -X POST https://your-backend.railway.app/calculate \
  -H "Content-Type: application/json" \
  -d @sample.json
```

### View Logs

- Railway Dashboard → Service → Logs
- Real-time log streaming
- Filter by date/search

---

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ Backend health check returns `{"status": "healthy"}`
2. ✅ API docs accessible at `/docs`
3. ✅ Frontend loads without errors
4. ✅ Calculator performs calculations
5. ✅ CSV upload and download works
6. ✅ Config editor can save changes
7. ✅ All 86 Excel fields working

**Congratulations! Your Motor Premium Calculator is now live on Railway! 🚀**
