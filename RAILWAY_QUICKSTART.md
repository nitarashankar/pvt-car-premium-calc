# Quick Railway Deployment Reference

## 🚀 Deploy to Railway in 3 Steps

### Step 1: Backend Deployment

1. **Sign up/Login:** [railway.app](https://railway.app)
2. **New Project:** Deploy from GitHub → Select repository
3. **Configure:**
   - Railway auto-detects Python
   - Uses `Procfile` or `railway.json`
   - Automatically installs from `requirements.txt`
4. **Get URL:** Click "Generate Domain"
   - Save this URL: `https://your-backend.up.railway.app`

### Step 2: Frontend Deployment

1. **Add New Service:** In same project → "New" → "Empty Service"
2. **Configure:**
   - Name: "Frontend"
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npx serve -s build -l $PORT`
3. **Set Environment Variable:**
   ```
   REACT_APP_API_URL=https://your-backend.up.railway.app
   ```
4. **Get URL:** Click "Generate Domain"

### Step 3: Test

1. **Backend:** Visit `https://your-backend.up.railway.app/docs`
2. **Frontend:** Visit `https://your-frontend.up.railway.app`
3. **Test Calculator:** Fill form and calculate
4. **Test CSV:** Upload CSV and download results

---

## 📁 CSV Processing - All 86 Fields

### Input Template

**Download:** `CSV_INPUT_TEMPLATE.csv`

**Required Columns (26 total):**
```
policy_type,vehicle_type,cc_category,zone,purchase_date,idv,
ncb_percent,od_discount_percent,builtin_cng_lpg,cng_lpg_si,
nil_dep,return_to_invoice,ncb_protect,engine_protection,
consumables,road_side_assistance,geo_extension,road_tax_cover,
courtesy_car,additional_towing,medical_expenses,loss_of_key,
tyre_rim_si,personal_effects,cpa_owner_driver,ll_paid_driver
```

### Output Format

**Total Columns: 87**
- `row_number` - Row reference
- Columns 2-27: Input fields (A-Z)
- Columns 28-57: Calculations (AA-BD)
- Columns 58-87: Display fields (BE-CH)

### Example Row

```csv
Package,New,1000cc_1500cc,A,2024-01-01,125000,20,0,0,0,1,1,0,1,1,1,0,0,0,0,1,0,0,1,1,0
```

**Output:** Complete premium breakdown with all 86 Excel fields

---

## 🔧 Environment Variables

### Backend (Railway)

```
PYTHON_VERSION=3.9
PORT=8000
PYTHONPATH=/app
FRONTEND_URL=https://your-frontend.up.railway.app
```

### Frontend (Railway)

```
NODE_ENV=production
REACT_APP_API_URL=https://your-backend.up.railway.app
PORT=3000
```

---

## 📊 Field Mapping - Excel to CSV

| Excel Range | Field Count | CSV Columns | Purpose |
|-------------|-------------|-------------|---------|
| A-Z | 26 | 2-27 | Input fields |
| AA-BD | 30 | 28-57 | Calculations |
| BE-CH | 30 | 58-87 | Display |
| **Total** | **86** | **87** | **(+row#)** |

---

## ✅ Verification Checklist

### After Deployment

- [ ] Backend health check: `/health` returns `{"status": "healthy"}`
- [ ] API docs accessible: `/docs` loads
- [ ] Frontend loads without errors
- [ ] Calculator form works
- [ ] CSV upload processes successfully
- [ ] CSV download includes all 87 columns
- [ ] Config editor can view/edit JSON

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `RAILWAY_DEPLOYMENT_GUIDE.md` | Complete deployment guide (14KB) |
| `CSV_PROCESSING_GUIDE.md` | CSV usage and field mapping (16KB) |
| `CSV_INPUT_TEMPLATE.csv` | Input template with 26 columns |
| `QUICKSTART.md` | Local development setup |
| `EXCEL_FIELD_IMPLEMENTATION.md` | Field implementation details |

---

## 🆘 Troubleshooting

### Backend Not Starting

**Check:**
- Build logs in Railway dashboard
- `requirements.txt` is complete
- Start command: `uvicorn src.premium_calculator.api:app --host 0.0.0.0 --port $PORT`

### Frontend Can't Connect to Backend

**Check:**
- `REACT_APP_API_URL` set correctly
- CORS enabled on backend
- Backend is running (check health endpoint)
- No typos in URL (no trailing slash)

### CSV Upload Fails

**Check:**
- CSV has all 26 required columns
- Required fields filled: `cc_category`, `zone`, `purchase_date`, `idv`
- Date format: `YYYY-MM-DD`
- Boolean fields: 0 or 1

---

## 💡 Quick Tips

1. **First Deploy:** Backend first, then frontend
2. **Environment:** Set `REACT_APP_API_URL` in frontend
3. **Testing:** Use `/docs` endpoint to test backend API
4. **CSV:** Use provided template for correct format
5. **Logs:** Check Railway logs for debugging

---

## 🎯 Success Criteria

✅ Backend deployed and accessible  
✅ Frontend deployed and accessible  
✅ Calculator performs calculations  
✅ CSV processing outputs 87 columns  
✅ All 86 Excel fields working  
✅ Config editor functional  

---

## 📞 Support

- **Railway Docs:** https://docs.railway.app
- **CSV Guide:** See `CSV_PROCESSING_GUIDE.md`
- **Deployment Guide:** See `RAILWAY_DEPLOYMENT_GUIDE.md`

---

**Your Motor Premium Calculator with ALL 86 Excel fields is ready for Railway! 🚀**
