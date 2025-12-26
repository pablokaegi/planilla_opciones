# Testing the Backend - Step-by-Step Guide

## Prerequisites
- Backend installed and dependencies met
- External API credentials configured (if not, use mock mode)

## Step 1: Start the Backend

```bash
cd backend
.\venv\Scripts\activate  # Windows
uvicorn main:app --reload
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## Step 2: Test Health Endpoint

Open browser or use curl:
```bash
curl http://localhost:8000/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-25T10:30:00.123456",
  "service": "Inky Web Options API (BYMA/Merval)",
  "version": "1.0.0"
}
```

## Step 3: Test Mock Data (No External API Required)

```bash
curl "http://localhost:8000/api/v1/chain/GGAL?use_mock=true"
```

This should return a complete option chain with Greeks calculated.

## Step 4: Test Real Data Integration

**Important**: You need to configure the external API endpoint first.

Edit `backend/.env`:
```bash
MARKET_DATA_BASE_URL=https://your-api-url.com
```

Then test:
```bash
curl http://localhost:8000/api/v1/chain/GGAL
```

### Expected Response Structure:

```json
{
  "ticker": "GGAL",
  "spot_price": 32.50,
  "timestamp": "2025-12-25T10:30:00",
  "expiration_date": "2025-D",
  "days_to_expiry": 120,
  "chain": [
    {
      "strike": 25.0,
      "call_bid": 8.50,
      "call_ask": 8.75,
      "call_last": 8.60,
      "call_volume": 1500,
      "call_open_interest": 3200,
      "call_iv": 0.4523,
      "call_delta": 0.8234,
      "call_gamma": 0.0123,
      "call_theta": -0.0234,
      "call_vega": 0.0823,
      "put_bid": 0.45,
      "put_ask": 0.50,
      "put_last": 0.48,
      "put_volume": 800,
      "put_open_interest": 1200,
      "put_iv": 0.4612,
      "put_delta": -0.1766,
      "put_gamma": 0.0123,
      "put_theta": -0.0198,
      "put_vega": 0.0823
    },
    // ... more strikes
  ]
}
```

## Step 5: View API Documentation

Navigate to: http://localhost:8000/docs

This opens the interactive Swagger UI where you can:
- See all endpoints
- Try API calls directly
- View request/response schemas

## Step 6: Verify Ticker Parsing

Check the logs for parsing confirmation:
```
INFO:     Looking for options with symbol: GFG
INFO:     Found 45 options for GGAL
```

## Step 7: Test Cache Behavior

Make the same request twice quickly:
```bash
curl http://localhost:8000/api/v1/chain/GGAL
curl http://localhost:8000/api/v1/chain/GGAL
```

Check logs - second request should show:
```
INFO:     Returning stocks data from cache
INFO:     Returning options data from cache
```

## Step 8: Clear Cache (if needed)

```bash
curl -X POST http://localhost:8000/api/v1/cache/clear
```

## Common Issues & Solutions

### Issue: "Failed to fetch stocks data"
**Cause**: External API not configured or unreachable
**Solution**: 
1. Check `.env` file has correct `MARKET_DATA_BASE_URL`
2. Use `?use_mock=true` for testing without external API
3. Check network/firewall settings

### Issue: "No options found for GGAL"
**Possible causes**:
1. Market is closed (no data available)
2. Ticker symbol mapping incorrect
3. No options exist for that ticker

**Solution**: 
- Check logs for parsing details
- Verify ticker exists in `symbol_map` in market_data.py
- Try with `use_mock=true`

### Issue: Greeks showing as null
**Causes**:
- Option price is 0 or invalid
- Calculation error (check logs)

**Solution**: Check backend logs for detailed error messages

### Issue: Module not found errors
```bash
pip install -r requirements.txt
```

## Verification Checklist

Before proceeding to frontend:

- [ ] Backend starts without errors
- [ ] Health endpoint returns 200 OK
- [ ] Mock data endpoint works (`?use_mock=true`)
- [ ] Real data endpoint connects to external API (or skip if not available)
- [ ] Greeks are calculated (not null)
- [ ] Cache is working (check logs on repeated requests)
- [ ] API docs accessible at `/docs`
- [ ] Ticker parsing works correctly (check logs)

## Key Files to Review

### 1. market_data.py (MOST CRITICAL)
This file handles:
- Fetching from external APIs
- Caching with TTL
- Parsing BYMA ticker format (GFGC3000D)
- Merging stocks + options data

**Key Method**: `get_option_chain()`

### 2. pricing_engine.py
- Calculates IV using py_vollib
- Computes all Greeks
- Handles edge cases (expired options, etc.)

### 3. endpoints.py
- REST API layer
- Groups options by strike
- Formats response

## Next Steps

Once backend testing is complete and you see correct JSON output:
1. Note the actual response structure
2. Verify Greeks values are reasonable
3. Check that GGAL price matches the options' underlying
4. Proceed to frontend integration

## Debug Mode

For verbose logging, edit `main.py`:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

Then restart the server to see detailed logs including:
- API requests
- Cache hits/misses
- Parsing details
- Greek calculations
