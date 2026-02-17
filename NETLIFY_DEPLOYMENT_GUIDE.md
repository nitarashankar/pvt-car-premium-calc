# Netlify Deployment Guide

This guide explains how to deploy the Motor Premium Calculator application to Netlify.

## Architecture

The application consists of two parts:
1. **Frontend**: React application (deployed to Netlify)
2. **Backend**: FastAPI REST API (can be deployed separately or as Netlify Functions)

## Deployment Options

### Option 1: Frontend Only on Netlify (Recommended for testing)

Deploy the frontend on Netlify and run the backend separately.

#### Steps:

1. **Prepare Frontend**:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Configure Environment**:
   Create `frontend/.env.production`:
   ```
   REACT_APP_API_URL=https://your-backend-url.com
   ```

3. **Deploy to Netlify**:
   
   **Option A: Using Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify init
   netlify deploy --prod
   ```

   **Option B: Using Netlify Dashboard**
   1. Go to https://app.netlify.com
   2. Click "Add new site" → "Import an existing project"
   3. Connect your GitHub repository
   4. Configure build settings:
      - Base directory: `frontend`
      - Build command: `npm run build`
      - Publish directory: `frontend/build`
   5. Click "Deploy site"

4. **Deploy Backend Separately**:
   
   Deploy the FastAPI backend to:
   - Heroku
   - Railway
   - Render
   - DigitalOcean App Platform
   - AWS Lambda (with Mangum)

### Option 2: Full Stack on Netlify (Using Netlify Functions)

Deploy both frontend and backend on Netlify using serverless functions.

#### Steps:

1. **Install Dependencies**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Create Netlify Functions**:
   
   Create `netlify/functions/api.py`:
   ```python
   from mangum import Mangum
   from src.premium_calculator.api import app
   
   handler = Mangum(app)
   ```

3. **Update Requirements**:
   Add to `requirements.txt`:
   ```
   mangum>=0.17.0
   ```

4. **Configure netlify.toml** (already created):
   ```toml
   [build]
     command = "npm run build"
     publish = "frontend/build"
     base = "frontend"
   
   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200
   ```

5. **Update Frontend API URL**:
   In `frontend/src/services/api.js`:
   ```javascript
   const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
   ```

6. **Deploy**:
   ```bash
   netlify init
   netlify deploy --prod
   ```

### Option 3: Docker Deployment (Production)

Use Docker for both frontend and backend.

1. **Build Docker Images**:
   ```bash
   # Backend
   docker build -t premium-calc-api -f Dockerfile.api .
   
   # Frontend
   docker build -t premium-calc-frontend -f Dockerfile.frontend .
   ```

2. **Deploy to Cloud**:
   - AWS ECS
   - Google Cloud Run
   - Azure Container Instances

## Environment Variables

### Frontend (.env.production)
```
REACT_APP_API_URL=https://your-api-url.com
```

### Backend
```
ALLOWED_ORIGINS=https://your-netlify-site.netlify.app
PORT=8000
```

## Post-Deployment Configuration

### 1. CORS Configuration

Update `src/premium_calculator/api.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-site.netlify.app",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Update JSON Configs

After deployment, you can update rate configurations through the Config Editor UI at:
`https://your-site.netlify.app` → Configuration tab

## Testing

### Test Frontend Deployment:
```bash
# Visit your Netlify URL
https://your-site.netlify.app

# Test calculator
# Test CSV upload
# Test config editor
```

### Test Backend API:
```bash
# Health check
curl https://your-api-url.com/health

# Calculate premium
curl -X POST https://your-api-url.com/calculate \
  -H "Content-Type: application/json" \
  -d @sample_input.json
```

## Monitoring

### Netlify Analytics
- Enable in Netlify dashboard
- Monitor page views, load times
- Track form submissions

### Backend Monitoring
- Use services like:
  - Sentry (error tracking)
  - LogRocket (session replay)
  - New Relic (APM)

## Performance Optimization

### Frontend
1. **Code Splitting**: Already enabled with React
2. **Lazy Loading**: Implement for routes
3. **Asset Optimization**: 
   - Images: Use WebP format
   - Fonts: Use system fonts or subset custom fonts
4. **Caching**: Configure in `netlify.toml`:
   ```toml
   [[headers]]
     for = "/static/*"
     [headers.values]
       Cache-Control = "public, max-age=31536000, immutable"
   ```

### Backend
1. **Enable Response Caching**: For config endpoints
2. **Database Connection Pooling**: If using DB
3. **CDN**: Use for JSON config files

## Troubleshooting

### Issue: CORS Errors
**Solution**: Update allowed origins in `api.py`

### Issue: 404 on Routes
**Solution**: Add redirect rule in `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Issue: Large Bundle Size
**Solution**: 
- Enable tree shaking
- Use production build
- Analyze bundle: `npm run build -- --stats`

### Issue: Slow API Responses
**Solution**:
- Deploy backend closer to users
- Enable response caching
- Optimize calculations

## Cost Estimation

### Netlify (Frontend)
- **Free Tier**: 100GB bandwidth, 300 build minutes/month
- **Pro**: $19/month (includes more bandwidth, build minutes)

### Backend Hosting
- **Heroku**: Free tier available, $7/month for Hobby
- **Railway**: $5/month for 500 hours
- **Render**: Free tier available
- **AWS Lambda**: Pay per request (very cost-effective for low traffic)

## Security

### Frontend
1. **HTTPS Only**: Enforced by Netlify
2. **Content Security Policy**: Add to `netlify.toml`
3. **Secure Headers**: Configure in Netlify

### Backend
1. **Input Validation**: Already implemented
2. **Rate Limiting**: Add middleware
3. **API Keys**: For production access
4. **Secrets Management**: Use environment variables

## Backup & Recovery

### Configuration Backup
Download JSON configs regularly:
1. Go to Configuration tab
2. Download each config file
3. Store in version control or secure location

### Automatic Backup
Set up GitHub Actions to backup configs:
```yaml
name: Backup Configs
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Backup configs
        run: |
          cp config/*.json backups/
          git add backups/
          git commit -m "Auto backup $(date)"
          git push
```

## Continuous Deployment

### GitHub Integration
1. Connect repository to Netlify
2. Enable automatic deploys from main branch
3. Set up deploy previews for pull requests

### Deploy Hooks
Create webhook in Netlify for manual triggers:
```bash
curl -X POST -d {} https://api.netlify.com/build_hooks/YOUR_HOOK_ID
```

## Support

For issues:
1. Check Netlify deploy logs
2. Review browser console for frontend errors
3. Check API logs for backend errors
4. Refer to documentation:
   - Netlify: https://docs.netlify.com
   - FastAPI: https://fastapi.tiangolo.com
   - React: https://react.dev

## Next Steps

After deployment:
1. ✅ Test all features
2. ✅ Configure custom domain
3. ✅ Set up SSL certificate (automatic on Netlify)
4. ✅ Enable analytics
5. ✅ Set up monitoring
6. ✅ Configure backup strategy
7. ✅ Document for team

## Quick Deploy Commands

```bash
# One-time setup
npm install -g netlify-cli
netlify login

# Deploy frontend
cd frontend
npm install
npm run build
netlify deploy --prod

# Update after changes
git push origin main  # Auto-deploys if GitHub connected
```

---

**Ready to deploy!** Follow the option that best fits your infrastructure needs.
