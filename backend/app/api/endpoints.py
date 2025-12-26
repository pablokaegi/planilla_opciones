"""
API Endpoints for Option Chain Data - BYMA/Merval Integration
"""
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime
from app.models.schemas import OptionChainResponse, OptionChainRow
from app.services.greeks import calculate_row_greeks
from app.services.market_data import market_data_service
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/chain/{ticker}", response_model=OptionChainResponse)
async def get_option_chain(
    ticker: str,
    use_mock: bool = Query(False, description="Use mock data instead of real API (for testing)")
):
    """
    Get option chain data for Argentine stocks (BYMA/Merval) with calculated Greeks.
    
    **Real Data Flow (Concurrency + Merge):**
    1. Fetches underlying price from /live/arg_stocks (async)
    2. Fetches options from /live/arg_options (async) 
    3. Both requests execute concurrently using asyncio.gather
    4. Parses option tickers: GFGC3000D → GFG, Call, 3000, December
    5. Merges: GGAL price + GFG options → Calculate Greeks
    6. Groups by strike in straddle view format
    
    **Parameters:**
    - **ticker**: Stock ticker symbol (e.g., GGAL, YPF, PAMP)
    - **use_mock**: If True, returns mock data for testing (default: False)
    
    **Supported Tickers:**
    - GGAL (Galicia) → Options: GFG*
    - YPF → Options: YPF*
    - PAMP (Pampa) → Options: PAM*
    - ALUA (Aluar) → Options: ALU*
    
    **Returns:**
    Complete option chain with bid/ask prices and Greeks (Delta, Gamma, Theta, Vega, IV)
    
    **Note:** Uses 35% risk-free rate for ARS market.
    """
    try:
        logger.info(f"Request for {ticker} option chain (mock={use_mock})")
        
        # For testing/development, allow mock data
        if use_mock:
            logger.info("Using mock data")
            return await get_mock_chain(ticker)
        
        # Fetch real market data
        chain_data = await market_data_service.get_option_chain(ticker)
        
        underlying_price = chain_data['underlying_price']
        options = chain_data['options']
        
        if not options:
            raise HTTPException(
                status_code=404,
                detail=f"No options found for {ticker}. Check if ticker is correct or market is open."
            )
        
        # Group options by strike
        strikes_dict = {}
        
        for option in options:
            # Round strike to nearest integer to ensure matching
            # This handles any floating point precision issues
            strike = round(float(option['strike']))
            option_type = option['option_type']
            
            # Initialize strike row if not exists
            if strike not in strikes_dict:
                strikes_dict[strike] = {
                    'strike': strike,
                    'calls': [],
                    'puts': []
                }
            
            # Calculate mid price for Greeks calculation
            bid = option.get('bid') or 0
            ask = option.get('ask') or 0
            last = option.get('last') or 0
            
            # Use last price if available, otherwise mid-point
            if last > 0:
                market_price = last
            elif bid > 0 and ask > 0:
                market_price = (bid + ask) / 2
            elif bid > 0:
                market_price = bid
            elif ask > 0:
                market_price = ask
            else:
                # No valid price data
                logger.warning(f"No valid price for {option['ticker']}")
                continue
            
            # Calculate Greeks only if we have a valid price
            greeks = None
            if market_price > 0.01:  # Minimum price threshold
                # Calculate time to expiry in years
                T = option['days_to_expiry'] / 365.0
                
                # Use the new greeks module
                greeks = calculate_row_greeks(
                    S=underlying_price,
                    K=strike,
                    T=T,
                    r=settings.default_risk_free_rate,
                    price=market_price,
                    option_type=option_type  # 'call' or 'put'
                )
            
            # Add to appropriate side
            option_with_greeks = {
                'ticker': option['ticker'],
                'bid': bid if bid > 0 else None,
                'ask': ask if ask > 0 else None,
                'last': last if last > 0 else None,
                'volume': option.get('volume'),
                'open_interest': option.get('open_interest'),
                'iv': greeks.get('iv') if greeks else None,
                'delta': greeks.get('delta') if greeks else None,
                'gamma': greeks.get('gamma') if greeks else None,
                'theta': greeks.get('theta') if greeks else None,
                'vega': greeks.get('vega') if greeks else None,
            }
            
            if option_type == 'call':
                strikes_dict[strike]['calls'].append(option_with_greeks)
            else:
                strikes_dict[strike]['puts'].append(option_with_greeks)
        
        # Build chain rows (straddle view)
        chain_rows = []
        for strike in sorted(strikes_dict.keys()):
            strike_data = strikes_dict[strike]
            
            # Get first call and put (or None if not available)
            call = strike_data['calls'][0] if strike_data['calls'] else {}
            put = strike_data['puts'][0] if strike_data['puts'] else {}
            
            row = OptionChainRow(
                strike=strike,
                # Call data
                call_bid=call.get('bid'),
                call_ask=call.get('ask'),
                call_last=call.get('last'),
                call_volume=call.get('volume'),
                call_open_interest=call.get('open_interest'),
                call_iv=call.get('iv'),
                call_delta=call.get('delta'),
                call_gamma=call.get('gamma'),
                call_theta=call.get('theta'),
                call_vega=call.get('vega'),
                # Put data
                put_bid=put.get('bid'),
                put_ask=put.get('ask'),
                put_last=put.get('last'),
                put_volume=put.get('volume'),
                put_open_interest=put.get('open_interest'),
                put_iv=put.get('iv'),
                put_delta=put.get('delta'),
                put_gamma=put.get('gamma'),
                put_theta=put.get('theta'),
                put_vega=put.get('vega'),
            )
            
            chain_rows.append(row)
        
        # Determine expiration date (use most common month_code)
        month_codes = [opt.get('month_code', '') for opt in options]
        most_common_month = max(set(month_codes), key=month_codes.count) if month_codes else 'D'
        days_to_expiry = options[0]['days_to_expiry'] if options else 30
        
        # Create response
        return OptionChainResponse(
            ticker=ticker.upper(),
            spot_price=underlying_price,
            timestamp=datetime.now(),
            expiration_date=f"2025-{most_common_month}",  # Simplified
            days_to_expiry=days_to_expiry,
            chain=chain_rows
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating option chain: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generating option chain: {str(e)}")


async def get_mock_chain(ticker: str) -> OptionChainResponse:
    """
    Generate mock option chain for testing (original implementation).
    """
    from datetime import timedelta
    import random
    
    # REALISTIC SPOT PRICES FOR ARGENTINE MARKET (ARS)
    spot_prices = {
        "GGAL": 8200.0,  # Banco Galicia - realistic ARS price
        "YPF": 7500.0,
        "PAMP": 6800.0,
        "ALUA": 5200.0
    }
    spot_price = spot_prices.get(ticker.upper(), 8200.0)
    days_to_expiry = 30
    
    # Generate strikes: Wide range from 4000 to 13000 in steps of 100
    # This ensures professional-looking round numbers
    strikes = []
    min_strike = 4000  # Fixed minimum for wide range
    max_strike = 13000  # Fixed maximum for wide range
    
    current_strike = min_strike
    while current_strike <= max_strike:
        strikes.append(current_strike)
        current_strike += 100
    
    chain_rows = []
    for strike in strikes:
        # PROFESSIONAL PRICING LOGIC
        # Calculate moneyness
        moneyness = spot_price - strike  # Positive = ITM call, Negative = OTM call
        
        # Call pricing: ITM must be >= intrinsic value
        intrinsic_call = max(0, spot_price - strike)
        
        # Time value decreases as we move away from ATM
        distance_from_atm = abs(moneyness) / spot_price
        time_value_pct = 0.06 * (1 - min(distance_from_atm * 2, 0.9))  # Max 6% at ATM
        
        # Call price = intrinsic + time value (minimum $10 for OTM)
        time_value_call = spot_price * time_value_pct * random.uniform(0.9, 1.1)
        call_mid_price = max(10.0, intrinsic_call + time_value_call)
        
        # Put pricing: ITM must be >= intrinsic value
        intrinsic_put = max(0, strike - spot_price)
        time_value_put = spot_price * time_value_pct * random.uniform(0.9, 1.1)
        put_mid_price = max(10.0, intrinsic_put + time_value_put)
        
        # Bid-Ask spread: 3-5% depending on liquidity
        spread_pct = 0.03 if abs(moneyness) < 500 else 0.05
        
        call_bid = round(call_mid_price * (1 - spread_pct), 2)
        call_ask = round(call_mid_price * (1 + spread_pct), 2)
        put_bid = round(put_mid_price * (1 - spread_pct), 2)
        put_ask = round(put_mid_price * (1 + spread_pct), 2)
        
        call_greeks = calculate_row_greeks(
            S=spot_price,
            K=strike,
            T=days_to_expiry / 365.0,
            r=settings.default_risk_free_rate,
            price=call_mid_price,
            option_type='call'
        )
        
        put_greeks = calculate_row_greeks(
            S=spot_price,
            K=strike,
            T=days_to_expiry / 365.0,
            r=settings.default_risk_free_rate,
            price=put_mid_price,
            option_type='put'
        )
        
        row = OptionChainRow(
            strike=strike,
            call_bid=call_bid,
            call_ask=call_ask,
            call_last=round(call_mid_price, 2),
            call_volume=random.randint(10, 1000),
            call_open_interest=random.randint(100, 5000),
            call_iv=call_greeks.get("iv"),
            call_delta=call_greeks.get("delta"),
            call_gamma=call_greeks.get("gamma"),
            call_theta=call_greeks.get("theta"),
            call_vega=call_greeks.get("vega"),
            put_bid=put_bid,
            put_ask=put_ask,
            put_last=round(put_mid_price, 2),
            put_volume=random.randint(10, 1000),
            put_open_interest=random.randint(100, 5000),
            put_iv=put_greeks.get("iv"),
            put_delta=put_greeks.get("delta"),
            put_gamma=put_greeks.get("gamma"),
            put_theta=put_greeks.get("theta"),
            put_vega=put_greeks.get("vega"),
        )
        
        chain_rows.append(row)
    
    expiration_date = (datetime.now() + timedelta(days=days_to_expiry)).strftime("%Y-%m-%d")
    
    return OptionChainResponse(
        ticker=ticker.upper(),
        spot_price=spot_price,
        timestamp=datetime.now(),
        expiration_date=expiration_date,
        days_to_expiry=days_to_expiry,
        chain=chain_rows
    )


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Inky Web Options API (BYMA/Merval)",
        "version": "1.0.0"
    }


@router.post("/cache/clear")
async def clear_cache():
    """Clear the market data cache (admin endpoint)."""
    market_data_service.clear_cache()
    return {
        "status": "success",
        "message": "Cache cleared",
        "timestamp": datetime.now().isoformat()
    }
