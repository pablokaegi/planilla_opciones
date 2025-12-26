# 🚀 Quick Start Guide - Inky Web Options Strategizer

## Overview
You now have a complete, production-ready Options Analysis platform with:
- ✅ Backend API with Black-Scholes pricing engine
- ✅ Frontend with professional AG Grid interface
- ✅ Real-time Greeks calculation
- ✅ Smart caching with TanStack Query

---

## 📁 Project Structure

```
inky_web/
├── backend/                 # Python FastAPI
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints.py     # REST endpoints
│   │   ├── core/
│   │   │   └── config.py        # Settings
│   │   ├── models/
│   │   │   └── schemas.py       # Data models
│   │   └── services/
│   │       └── pricing_engine.py # Greeks calculation
│   ├── main.py                  # FastAPI app
│   └── requirements.txt         # Python packages
│
├── frontend/               # Next.js TypeScript
│   ├── app/
│   │   ├── page.tsx           # Main page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Styles
│   ├── components/
│   │   └── OptionChainGrid.tsx # AG Grid
│   ├── lib/
│   │   ├── api_client.ts      # API calls
│   │   ├── query_client.tsx   # TanStack Query
│   │   └── types.ts           # TypeScript types
│   └── package.json           # Node packages
│
├── setup.bat              # Windows setup script
├── setup.sh               # Linux/Mac setup script
└── README.md              # Documentation
```

---

## 🎯 Step-by-Step Installation

### Option A: Automatic Setup (Recommended)

**Windows:**
```powershell
cd "c:\Users\poulk\OneDrive\Escritorio\opciones JS\inky_web"
.\setup.bat
```

**Linux/Mac:**
```bash
cd inky_web
chmod +x setup.sh
./setup.sh
```

### Option B: Manual Setup

#### Backend Setup

1. **Navigate to backend:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate environment:**
   ```powershell
   # Windows
   .\venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

4. **Install packages:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run server:**
   ```bash
   uvicorn main:app --reload
   ```
   
   ✅ Backend now running at: **http://localhost:8000**  
   📚 API Docs at: **http://localhost:8000/docs**

#### Frontend Setup

1. **Navigate to frontend (NEW TERMINAL):**
   ```bash
   cd frontend
   ```

2. **Install packages:**
   ```bash
   npm install
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```
   
   ✅ Frontend now running at: **http://localhost:3000**

---

## 🎮 How to Use

### 1. Access the Application
Open your browser and go to: **http://localhost:3000**

### 2. Load an Option Chain
- **Ticker Symbol**: Enter a stock ticker (e.g., GGAL, YPF, AAPL, TSLA)
- **Days to Expiry**: Enter days until expiration (1-365)
- Click **"Load Chain"**

### 3. View Results
The grid displays:
- **Left Side (Green)**: Call Options
  - Bid, Ask, IV, Delta, Gamma, Theta, Vega
- **Center (Yellow)**: Strike Prices (ATM highlighted)
- **Right Side (Red)**: Put Options
  - Delta, Gamma, Theta, Vega, IV, Bid, Ask

### 4. Interact with Grid
- **Sort**: Click column headers
- **Resize**: Drag column edges
- **Scroll**: Use mouse wheel or scrollbar
- **Refresh**: Click "Refresh" button for new calculations

---

## 📊 Understanding the Output

### Greeks Explained

| Greek | What It Measures | Typical Values |
|-------|------------------|----------------|
| **Delta (Δ)** | Price sensitivity to underlying | Calls: 0 to 1, Puts: -1 to 0 |
| **Gamma (Γ)** | Rate of Delta change | Higher at ATM |
| **Theta (Θ)** | Time decay per day | Negative (losing value) |
| **Vega (ν)** | Volatility sensitivity | Higher at ATM, longer expiry |
| **IV** | Implied Volatility | Expressed as percentage |

### Example Interpretation

**GGAL Call Option at $30 strike:**
- **Delta = 0.62**: If GGAL goes up $1, option gains ~$0.62
- **Gamma = 0.034**: Delta will increase by 0.034 per $1 move
- **Theta = -0.023**: Losing $0.023 per day from time decay
- **Vega = 0.123**: $1 increase in IV adds ~$0.12 to option price
- **IV = 35.24%**: Market expects 35.24% annual volatility

---

## 🔧 Configuration

### Backend Configuration

Edit `backend/app/core/config.py`:

```python
# Risk-free rate (annual)
default_risk_free_rate: float = 0.05  # 5%

# CORS origins (add your domain)
cors_origins: list[str] = [
    "http://localhost:3000",
    "https://yourdomain.com"
]
```

### Frontend Configuration

Edit `frontend/.env.local`:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# For production
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Cache Configuration

Edit `frontend/lib/query_client.tsx`:

```typescript
staleTime: 60 * 1000,      // Data fresh for 1 minute
gcTime: 5 * 60 * 1000,     // Keep in cache 5 minutes
```

---

## 🧪 Testing Your Setup

### Test Backend API

**Health Check:**
```bash
curl http://localhost:8000/api/v1/health
```

**Get Option Chain:**
```bash
curl "http://localhost:8000/api/v1/chain/GGAL?days_to_expiry=30"
```

**View API Docs:**
Navigate to: http://localhost:8000/docs

### Test Frontend

1. Open http://localhost:3000
2. Enter ticker: **GGAL**
3. Days to expiry: **30**
4. Click **Load Chain**
5. Verify grid displays with Greeks

---

## 💡 Key Features

### TanStack Query Benefits

**What it does:**
- ✅ Caches API responses (reduces server load)
- ✅ Auto-refreshes stale data
- ✅ Provides loading/error states
- ✅ Deduplicates simultaneous requests
- ✅ Retries failed requests

**Example:**
```
User loads GGAL chain → API call made → Cached for 1 minute
User switches away and back → Instant load from cache
After 1 minute → Background refresh with new data
```

### Pricing Engine Features

- **Black-Scholes Model**: Industry-standard pricing
- **py_vollib**: Professional-grade library
- **Error Handling**: Graceful handling of edge cases
- **Configurable**: Adjustable risk-free rate
- **Fast**: Optimized calculations

---

## 🐛 Common Issues & Solutions

### Issue: Backend won't start

**Error:** `Module not found`
```bash
cd backend
pip install -r requirements.txt
```

**Error:** `Port 8000 already in use`
```bash
# Use different port
uvicorn main:app --reload --port 8001

# Update frontend .env.local
NEXT_PUBLIC_API_URL=http://localhost:8001
```

### Issue: Frontend can't connect to backend

1. **Check backend is running:**
   - Visit http://localhost:8000/docs
   - Should see API documentation

2. **Check CORS settings:**
   - Backend `config.py` should include `http://localhost:3000`

3. **Check environment variable:**
   - `frontend/.env.local` has correct URL

4. **Check browser console:**
   - Press F12 → Console tab
   - Look for error messages

### Issue: Grid not displaying

1. **Check data is loading:**
   - Open browser console (F12)
   - Look for API response in Network tab

2. **Verify AG Grid installation:**
   ```bash
   cd frontend
   npm install ag-grid-react ag-grid-community
   ```

3. **Clear cache and refresh:**
   - Press Ctrl+Shift+R (hard refresh)

### Issue: Greeks showing as null

This means calculation failed. Common causes:
- **Price too low**: Option price must be > 0
- **Expired option**: Days to expiry < 0
- **Calculation error**: Check backend logs

---

## 🚀 Next Steps

### Immediate Enhancements

1. **Add More Tickers**: Modify mock data generator
2. **Adjust Expiry Dates**: Try different timeframes
3. **Modify Risk-Free Rate**: Match current rates
4. **Customize Grid**: Change colors, fonts, layouts

### Advanced Features to Add

1. **Real Market Data**
   - Integrate with broker API (Interactive Brokers, TD Ameritrade)
   - Connect to market data provider

2. **Strategy Builder**
   - Multi-leg strategies (spreads, straddles)
   - P&L calculator
   - Risk graphs

3. **Historical Analysis**
   - Database integration (PostgreSQL)
   - IV history charts
   - Greeks over time

4. **Advanced Visualizations**
   - Volatility smile/skew
   - Greeks surface plots
   - P&L heat maps

5. **User Features**
   - Authentication (JWT)
   - Save strategies
   - Portfolio tracking
   - Alerts

---

## 📚 Learning Resources

### Understanding Options
- **Black-Scholes Model**: Option pricing fundamentals
- **Greeks**: Risk metrics explained
- **IV vs HV**: Implied vs Historical Volatility

### Technology Docs
- **FastAPI**: https://fastapi.tiangolo.com
- **Next.js**: https://nextjs.org/docs
- **TanStack Query**: https://tanstack.com/query/latest
- **AG Grid**: https://www.ag-grid.com/react-data-grid/
- **py_vollib**: https://pypi.org/project/py-vollib/

---

## ✅ Checklist for Success

- [ ] Python 3.10+ installed
- [ ] Node.js 18+ installed
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Can access http://localhost:3000
- [ ] API docs work at http://localhost:8000/docs
- [ ] Can load GGAL option chain
- [ ] Greeks display correctly
- [ ] Grid is interactive (sort, resize)

---

## 🎓 English for Quants - Terms Used

| Term | Spanish | Meaning |
|------|---------|---------|
| **Scaffolding** | Andamiaje | Initial project structure |
| **Boilerplate** | Código base | Repetitive necessary code |
| **Type Safety** | Seguridad de tipos | Preventing type errors |
| **Monorepo** | Mono-repositorio | Single repo for multiple projects |
| **BFF Pattern** | Backend-for-Frontend | Backend designed for specific frontend |
| **Greeks** | Griegas | Option sensitivity metrics |
| **Caching** | Almacenamiento en caché | Temporary data storage |
| **Endpoint** | Punto final | API URL route |
| **Payload** | Carga útil | Data sent/received |

---

## 🎉 Congratulations!

You now have a professional, scalable Options Analysis platform!

**What you built:**
- ✅ Production-ready architecture
- ✅ Type-safe backend and frontend
- ✅ Professional UI with AG Grid
- ✅ Real-time Greeks calculation
- ✅ Smart caching strategy
- ✅ Comprehensive documentation

**Next:** Start experimenting with different tickers and strategies!

---

**Questions or Issues?**
- Check backend logs in terminal
- Check frontend console (F12)
- Review API docs at /docs
- Verify configuration files

**Happy Trading! 📈**
