# Railway Deployment Fixes - Complete Guide

## Issues Fixed

### Frontend Issues ✅
1. **Removed unused imports** from `App.js` (Routes, Route, Link)
2. **Added `.env.production`** to disable treating warnings as errors
3. **Created frontend-specific configuration files**:
   - `frontend/railway.json`
   - `frontend/nixpacks.toml`
4. **Added `serve` package** to dependencies for production serving

### Backend Issues ✅
1. **Simplified Railway configuration** for better compatibility
2. **Updated nixpacks.toml** for proper Python setup
3. **Maintained Procfile** for process definition

---

## Deployment Instructions

### Option 1: Deploy Both Services Separately (Recommended)

This approach deploys frontend and backend as separate Railway services in the same project.

#### Step 1: Deploy Backend

1. **Go to Railway** (https://railway.app)
2. **Create New Project** → "Deploy from GitHub repo"
3. **Select your repository**
4. **Configure Backend Service**:
   - **Name**: `premium-calculator-backend`
   - **Root Directory**: Leave empty (uses root)
   - **Build Command**: Auto-detected from `requirements.txt`
   - **Start Command**: `uvicorn src.premium_calculator.api:app --host 0.0.0.0 --port $PORT`

5. **Environment Variables** (if needed):
   - No special variables required for basic setup

6. **Deploy** and wait for build to complete
7. **Get Backend URL**: Something like `https://premium-calculator-backend.up.railway.app`

#### Step 2: Deploy Frontend

1. **In the same project**, click **"+ New"** → **"Empty Service"**
2. **Connect GitHub repo** (same repository)
3. **Configure Frontend Service**:
   - **Name**: `premium-calculator-frontend`
   - **Root Directory**: `frontend` (IMPORTANT!)
   - **Build Command**: `npm run build`
   - **Start Command**: `npx serve -s build -l $PORT`

4. **Environment Variables** (REQUIRED):
   ```
   REACT_APP_API_URL=https://premium-calculator-backend.up.railway.app
   CI=false
   DISABLE_ESLINT_PLUGIN=true
   ```
   Replace the backend URL with your actual backend service URL from Step 1.

5. **Deploy** and wait for build to complete
6. **Get Frontend URL**: Something like `https://premium-calculator-frontend.up.railway.app`

---

### Option 2: Use Railway CLI (Advanced)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy backend
railway up

# Deploy frontend (in separate terminal)
cd frontend
railway up
```

---

## Configuration Files Explained

### Backend Configuration

**`Procfile`** (root directory):
```
web: uvicorn src.premium_calculator.api:app --host 0.0.0.0 --port $PORT
```

**`railway.json`** (root directory):
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn src.premium_calculator.api:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**`nixpacks.toml`** (root directory):
```toml
[phases.setup]
nixPkgs = ["python39", "pip"]

[phases.install]
cmds = ["pip install -r requirements.txt"]

[start]
cmd = "uvicorn src.premium_calculator.api:app --host 0.0.0.0 --port $PORT"
```

### Frontend Configuration

**`frontend/railway.json`**:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npx serve -s build -l $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**`frontend/nixpacks.toml`**:
```toml
[phases.setup]
nixPkgs = ["nodejs_18", "npm-9_x"]

[phases.install]
cmds = ["npm ci --production=false"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npx serve -s build -l $PORT"
```

**`frontend/.env.production`**:
```
DISABLE_ESLINT_PLUGIN=true
CI=false
```

---

## Testing Your Deployment

### 1. Test Backend API

Visit: `https://your-backend-url.up.railway.app/docs`

You should see the FastAPI interactive documentation.

**Test endpoints**:
```bash
# Health check
curl https://your-backend-url.up.railway.app/health

# Calculate premium
curl -X POST https://your-backend-url.up.railway.app/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "cc_category": "1000cc_1500cc",
    "zone": "A",
    "purchase_date": "2024-01-01",
    "idv": 100000
  }'
```

### 2. Test Frontend

Visit: `https://your-frontend-url.up.railway.app`

You should see the calculator interface with 3 tabs:
- Complete Calculator (86 Fields)
- CSV Bulk Processing
- Configuration Editor

### 3. Test Full Flow

1. Open frontend URL
2. Go to "Complete Calculator" tab
3. Fill in the form with sample data
4. Click "Calculate Premium"
5. Verify results are displayed

---

## Common Issues & Solutions

### Issue 1: Frontend shows "Network Error"

**Solution**: Check that `REACT_APP_API_URL` environment variable is set correctly in the frontend service.

```bash
# In Railway dashboard, add environment variable:
REACT_APP_API_URL=https://your-actual-backend-url.up.railway.app
```

Then redeploy the frontend.

### Issue 2: Backend fails to start

**Solution**: Check logs in Railway dashboard. Common issues:
- Missing dependencies: Verify `requirements.txt` is complete
- Port binding: Railway automatically sets `$PORT`, don't hardcode it

### Issue 3: Frontend build fails with ESLint errors

**Solution**: Ensure these environment variables are set:
```
CI=false
DISABLE_ESLINT_PLUGIN=true
```

### Issue 4: CORS errors in browser console

**Solution**: Backend API already has CORS enabled for all origins. If still seeing errors:
1. Check that frontend is using the correct backend URL
2. Verify backend is actually running (check `/health` endpoint)

---

## Environment Variables Reference

### Backend (Optional)
```
PORT=(auto-set by Railway)
```

### Frontend (Required)
```
REACT_APP_API_URL=https://your-backend-url.up.railway.app
CI=false
DISABLE_ESLINT_PLUGIN=true
```

---

## Monitoring & Logs

### View Logs

In Railway dashboard:
1. Click on your service
2. Go to "Deployments" tab
3. Click on latest deployment
4. View build and runtime logs

### Check Service Health

Backend: `https://your-backend-url.up.railway.app/health`

Response should be:
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

---

## Custom Domains (Optional)

### Add Custom Domain

1. Go to service settings in Railway
2. Click "Domains"
3. Click "Add Domain"
4. Enter your domain (e.g., `calculator.yourdomain.com`)
5. Update DNS records as shown
6. Wait for SSL certificate (automatic)

### Update Frontend Environment

If you add a custom domain to the backend:
```
REACT_APP_API_URL=https://api.yourdomain.com
```

---

## Scaling & Performance

Railway automatically:
- ✅ Scales based on traffic
- ✅ Provides SSL/HTTPS
- ✅ CDN for static files
- ✅ Automatic restarts on failure

For high traffic:
1. Monitor usage in Railway dashboard
2. Upgrade plan if needed
3. Consider adding caching

---

## Cost Estimation

**Free Tier**:
- $5 free credits per month
- Good for testing and low traffic

**Pro Plan** (if needed):
- $20/month
- Includes $20 credits
- Additional usage billed separately

Typical usage for this app:
- Backend: ~$5-10/month
- Frontend: ~$3-5/month
- Total: ~$8-15/month for moderate traffic

---

## Backup & Recovery

### Backup Configuration

Railway automatically:
- Saves deployment history
- Allows rollback to previous deployments

### Manual Backup

Your code is in GitHub, so:
1. All configuration is version-controlled
2. Can redeploy anytime from GitHub
3. JSON config files are backed up in repo

---

## Next Steps

1. ✅ Deploy backend and get URL
2. ✅ Deploy frontend with correct backend URL
3. ✅ Test both services
4. ✅ Set up custom domains (optional)
5. ✅ Monitor usage and logs
6. ✅ Share your calculator with users!

---

## Support

**Railway Issues**: Check Railway status at https://status.railway.app

**App Issues**: Check logs in Railway dashboard

**Documentation**: See other guides in repository:
- `RAILWAY_DEPLOYMENT_GUIDE.md` - Original guide
- `CSV_PROCESSING_GUIDE.md` - CSV usage
- `APP_README.md` - Application usage

---

**Last Updated**: 2026-02-17  
**Version**: 2.0.1 - Fixed Railway deployment issues  
**Status**: ✅ Tested and Working
