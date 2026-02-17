# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Python 3.9+
- Node.js 18+
- pip and npm

### Installation

**Option 1: Automated Setup**
```bash
./setup.sh
```

**Option 2: Manual Setup**
```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies
cd frontend
npm install
cd ..
```

### Run the Application

**Terminal 1 - Start Backend:**
```bash
uvicorn src.premium_calculator.api:app --reload
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm start
```

**Open in Browser:**
```
http://localhost:3000
```

## 📖 Usage

### 1. Single Calculation
1. Fill in vehicle details (CC, Zone, Date, IDV)
2. Select add-on covers
3. Click "Calculate Premium"
4. View detailed breakdown

### 2. Bulk CSV Processing
1. Download sample CSV
2. Fill in your data
3. Upload CSV file
4. Click "Process CSV"
5. Download results

### 3. Configuration Editor
1. Select config type (OD Rates, Add-ons, etc.)
2. Edit JSON
3. Save changes
4. Download backup

## 🔗 API Documentation

Visit: `http://localhost:8000/docs`

## 📝 Example API Call

```bash
curl -X POST http://localhost:8000/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "cc_category": "1000cc_1500cc",
    "zone": "A",
    "purchase_date": "2024-01-01",
    "idv": 100000,
    "ncb_percent": 0.2,
    "cpa_owner_driver": 1
  }'
```

## 🎯 Testing

```bash
# Test calculator
python examples.py

# Test CSV processing
python -c "from premium_calculator.core.csv_processor import CSVProcessor; \
           p = CSVProcessor(); \
           print(p.process_csv_file('sample_input.csv'))"
```

## 🚢 Deploy to Netlify

```bash
cd frontend
npm run build
netlify deploy --prod
```

See [NETLIFY_DEPLOYMENT_GUIDE.md](NETLIFY_DEPLOYMENT_GUIDE.md) for details.

## 📚 Full Documentation

- [APP_README.md](APP_README.md) - Complete feature guide
- [NETLIFY_DEPLOYMENT_GUIDE.md](NETLIFY_DEPLOYMENT_GUIDE.md) - Deployment
- [IMPLEMENTATION_README.md](IMPLEMENTATION_README.md) - Technical details

## 🆘 Need Help?

- Check API docs: `http://localhost:8000/docs`
- Review examples: `python examples.py`
- Read full README: [APP_README.md](APP_README.md)

## ✅ Checklist

- [ ] Install dependencies (`./setup.sh`)
- [ ] Start backend (`uvicorn src.premium_calculator.api:app --reload`)
- [ ] Start frontend (`cd frontend && npm start`)
- [ ] Test calculator at `http://localhost:3000`
- [ ] Try CSV upload
- [ ] Edit configuration
- [ ] Deploy to Netlify (optional)

---

**Ready to calculate premiums!** 🎉
