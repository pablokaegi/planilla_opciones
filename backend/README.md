# Inky Web Backend - Argentine Market Edition

Professional Options Strategizer API for BYMA/Merval built with FastAPI.

## 🎯 Key Features

- **Real-time Market Data**: Integrates with Argentine stocks & options APIs
- **Smart Caching**: 20-second TTL cache respecting API rate limits (120 req/min)
- **Ticker Parsing**: Handles BYMA format (GFGC3000D = Galicia Call 3000 December)
- **Greeks Calculation**: Black-Scholes with py_vollib
- **Async Architecture**: Parallel fetching of stocks + options
- **Type Safety**: Pydantic models throughout

## 🏗️ Architecture

### Data Flow

```
External APIs (BYMA/Merval)
    ↓
Market Data Service (with caching)
    ↓
Ticker Parser (GFGC3000D → Symbol, Type, Strike, Month)
    ↓
Pricing Engine (Black-Scholes + Greeks)
    ↓
REST API Endpoint
    ↓
Frontend (Next.js)
```

### Key Components

1. **market_data.py**: Core service for fetching/parsing/caching
2. **pricing_engine.py**: Greeks calculation engine
3. **endpoints.py**: REST API layer
4. **config.py**: Configuration (risk-free rate = 30% for ARS)

## 📋 Setup

### 1. Create Virtual Environment

```bash
python -m venv venv

# Windows
.\venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit with your API credentials
notepad .env  # Windows
nano .env     # Linux/Mac
```

**Required settings in `.env`:**
```bash
MARKET_DATA_BASE_URL=https://your-api-endpoint.com
DEFAULT_RISK_FREE_RATE=0.30  # 30% for ARS
```

### 4. Run Server

```bash
uvicorn main:app --reload
```

Server runs at: **http://localhost:8000**  
API Docs: **http://localhost:8000/docs**

## 🔌 API Endpoints

### Get Option Chain (Real Data)
```http
GET /api/v1/chain/{ticker}
```

Example:
```bash
curl http://localhost:8000/api/v1/chain/GGAL
```

**Supported Tickers:**
- `GGAL` (Galicia) → Options: GFG*
- `YPF` → Options: YPF*
- `PAMP` (Pampa) → Options: PAM*
- `ALUA` (Aluar) → Options: ALU*

### Get Option Chain (Mock Data)
```http
GET /api/v1/chain/{ticker}?use_mock=true
```

For testing without external API connection.

### Health Check
```http
GET /api/v1/health
```

### Clear Cache
```http
POST /api/v1/cache/clear
```

## 🧮 Ticker Format (BYMA)

**Format**: `[Symbol][Type][Strike][Month]`

**Examples:**
- `GFGC3000D`: Galicia (GFG), Call (C), Strike 3000, December (D)
- `GFGV2500E`: Galicia (GFG), Put (V=Venta), Strike 2500, May (E)
- `YPFC5000F`: YPF, Call (C), Strike 5000, June (F)

**Type Codes:**
- `C` = Call
- `V` = Put (Venta in Spanish)

**Month Codes:**
- A=Jan, B=Feb, C=Mar, D=Apr, E=May, F=Jun
- G=Jul, H=Aug, I=Sep, J=Oct, K=Nov, L=Dec

## 🔄 Caching Strategy

**Problem**: External API updates every 20s with rate limit of 120 req/min

**Solution**: In-memory TTL cache
- Cache duration: 20 seconds
- Library: `cachetools.TTLCache`
- Separate caches for stocks and options
- Automatic expiration and refresh

**Benefits:**
- Respects rate limits
- Fast response times
- Reduced API calls
- Lower costs

## 🧪 Testing

See [TESTING.md](TESTING.md) for comprehensive testing guide.

**Quick Test:**
```bash
# Test with mock data (no external API needed)
curl "http://localhost:8000/api/v1/chain/GGAL?use_mock=true"

# Test real data
curl http://localhost:8000/api/v1/chain/GGAL
```

## 📊 Response Format

```json
{
  "ticker": "GGAL",
  "spot_price": 32.50,
  "timestamp": "2025-12-25T10:30:00",
  "expiration_date": "2025-D",
  "days_to_expiry": 120,
  "chain": [
    {
      "strike": 30.0,
      "call_bid": 4.50,
      "call_ask": 4.75,
      "call_iv": 0.4523,
      "call_delta": 0.6234,
      "call_gamma": 0.0342,
      "call_theta": -0.0234,
      "call_vega": 0.1234,
      "put_bid": 2.10,
      "put_ask": 2.20,
      "put_iv": 0.4612,
      "put_delta": -0.3766,
      ...
    }
  ]
}
```

## 🔧 Configuration

### Risk-Free Rate
Default: 30% (representative of Argentine market)

Adjust in `.env`:
```bash
DEFAULT_RISK_FREE_RATE=0.30
```

### Cache TTL
Default: 20 seconds (matching API update frequency)

Adjust in `.env`:
```bash
CACHE_TTL_SECONDS=20
```

### Symbol Mapping

Add new tickers in `market_data.py`:
```python
symbol_map = {
    'GGAL': 'GFG',  # Galicia
    'YPF': 'YPF',
    'PAMP': 'PAM',
    'NEWSTOCK': 'NEW',  # Add here
}
```

## 🐛 Troubleshooting

### "Failed to fetch stocks data"
1. Check `.env` has correct `MARKET_DATA_BASE_URL`
2. Verify API credentials/access
3. Check network connectivity
4. Use `?use_mock=true` for testing

### "No options found for GGAL"
1. Check if market is open
2. Verify ticker symbol mapping
3. Check logs for parsing errors
4. Ensure options exist for that ticker

### Greeks showing as null
1. Check option has valid price (bid/ask/last)
2. Review logs for calculation errors
3. Verify days to expiry > 0

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── endpoints.py       # REST API routes
│   ├── core/
│   │   └── config.py          # Configuration
│   ├── models/
│   │   └── schemas.py         # Pydantic models
│   └── services/
│       ├── market_data.py     # ⭐ Core service (fetch/parse/cache)
│       └── pricing_engine.py  # Greeks calculation
├── main.py                     # FastAPI application
├── requirements.txt            # Dependencies
├── .env.example               # Config template
├── TESTING.md                 # Testing guide
└── README.md                  # This file
```

## 🚀 Production Considerations

### External API
- Store credentials securely (environment variables)
- Implement retry logic for failed requests
- Monitor API usage vs rate limits
- Handle market hours (no data when closed)

### Caching
- Consider Redis for distributed caching
- Monitor cache hit rate
- Adjust TTL based on data update frequency

### Performance
- Use async endpoints throughout
- Consider connection pooling for httpx
- Monitor response times

### Error Handling
- Graceful degradation when API unavailable
- Fallback to cached data if API fails
- Proper error messages to frontend

## 📚 Key Libraries

- **FastAPI**: Modern async web framework
- **httpx**: Async HTTP client
- **cachetools**: In-memory caching
- **py_vollib**: Black-Scholes & Greeks
- **Pydantic**: Data validation

## 🎓 Market-Specific Notes

### Argentine Market (BYMA/Merval)
- High volatility → Higher risk-free rate (30%)
- Currency: ARS (Argentine Peso)
- Options format: Proprietary BYMA ticker structure
- Market hours: Check BYMA schedule

### Adaptations
- Risk-free rate adjusted for ARS
- Ticker parser handles BYMA format
- Symbol mapping for common stocks

## ✅ Before Moving to Frontend

Verify these work:
- [ ] Backend starts without errors
- [ ] Health check returns 200
- [ ] Mock data endpoint works
- [ ] Real data fetches (if API configured)
- [ ] Greeks calculate correctly
- [ ] Cache behavior correct
- [ ] Ticker parsing works
- [ ] API docs render at `/docs`

Once backend is solid, proceed to frontend integration.

---

**Built for Argentine Quants with ❤️**
