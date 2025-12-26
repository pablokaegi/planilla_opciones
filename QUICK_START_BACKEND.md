# 🚀 QUICK START - Testing Your Backend

## 1️⃣ Start the Server (Choose One Method)

### Method A: Using PowerShell Script (Easiest)
```powershell
cd backend
.\test-backend.ps1
```

### Method B: Manual Steps
```powershell
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## 2️⃣ Test with Mock Data (No External API Needed)

Open your browser and go to:
```
http://127.0.0.1:8000/api/v1/chain/ggal?use_mock=true
```

Or use PowerShell:
```powershell
curl http://127.0.0.1:8000/api/v1/chain/ggal?use_mock=true
```

**Expected Result:** JSON with option chain data including Greeks

## 3️⃣ View API Documentation

```
http://127.0.0.1:8000/docs
```

Interactive Swagger UI where you can test all endpoints.

## 4️⃣ Configure Real API (When Ready)

Edit `backend\.env`:
```bash
MARKET_DATA_BASE_URL=https://your-actual-api-url.com
```

Then test real data:
```
http://127.0.0.1:8000/api/v1/chain/ggal
```

## 5️⃣ What to Look For in JSON Response

### ✅ Good Response:
```json
{
  "ticker": "GGAL",
  "spot_price": 32.50,
  "chain": [
    {
      "strike": 30.0,
      "call_iv": 0.4523,      // ← Should be a number
      "call_delta": 0.6234,   // ← Between 0 and 1
      "call_gamma": 0.0342,   // ← Positive
      "call_theta": -0.0234,  // ← Usually negative
      "call_vega": 0.1234,    // ← Positive
      "put_delta": -0.3766,   // ← Between -1 and 0
      ...
    }
  ]
}
```

### ❌ Issues to Check:
- `"call_iv": null` → Calculation failed, check logs
- `"spot_price": 0` → Couldn't find GGAL in stocks data
- `"chain": []` → No options found, check ticker parsing

## 6️⃣ Check Server Logs

Look for these messages in terminal:

**✅ Good:**
```
INFO: Fetching option chain for ggal
INFO: Underlying GGAL price: $32.50
INFO: Looking for options with symbol: GFG
INFO: Found 45 options for GGAL
```

**❌ Problems:**
```
WARNING: Failed to parse ticker: GFGC3000
ERROR: Failed to fetch stocks data
WARNING: No options found for GGAL
```

## 7️⃣ Test Cache Behavior

Make same request twice quickly:
```powershell
# First request - fetches from API
curl http://127.0.0.1:8000/api/v1/chain/ggal?use_mock=true

# Second request - uses cache
curl http://127.0.0.1:8000/api/v1/chain/ggal?use_mock=true
```

Check logs for:
```
INFO: Returning stocks data from cache
INFO: Returning options data from cache
```

## 8️⃣ Clear Cache (If Needed)

```powershell
curl -X POST http://127.0.0.1:8000/api/v1/cache/clear
```

## 9️⃣ Common Issues

### Server won't start:
```powershell
pip install -r requirements.txt
```

### "Module not found" errors:
Make sure virtual environment is activated:
```powershell
.\venv\Scripts\activate
```

### Greeks showing as null:
- Check option has valid price
- Check logs for calculation errors
- Verify days to expiry > 0

### Can't connect to external API:
- Use `?use_mock=true` to bypass
- Check `.env` has correct URL
- Verify network/firewall

## 🎯 Success Criteria

Backend is working when you see:

- ✅ Server starts without errors
- ✅ `/docs` page loads
- ✅ Mock endpoint returns valid JSON
- ✅ Greeks are calculated (not null)
- ✅ Call delta between 0-1
- ✅ Put delta between -1-0
- ✅ IV values reasonable (0.2-1.0)
- ✅ Cache working (logs confirm)

## 🚀 Next Steps

Once backend is verified:

1. ✅ Backend working with mock data
2. 🔄 Configure real API (when available)
3. ➡️ **Start frontend development**

Frontend will poll this endpoint every 20 seconds and display in AG Grid.

---

**Need Help?**
- Check `TESTING.md` for detailed troubleshooting
- Review `IMPLEMENTATION_NOTES.md` for architecture details
- Check server logs in terminal for specific errors

**Ready? Start with Method A above! 🎉**
