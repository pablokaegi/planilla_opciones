"""
Market Data Service for Argentine Options (BYMA/Merval)
Handles fetching, parsing, caching, and merging stock + option data

This is THE CORE ENGINE that:
1. Fetches stocks + options concurrently (async)
2. Extracts GGAL underlying price
3. Parses GFG option tickers
4. Merges data and calculates Greeks
5. Returns structured payload to API
"""
import re
import asyncio
from typing import Optional, Dict, List, Tuple
from datetime import datetime, timedelta
from cachetools import TTLCache, cached
import httpx
from app.core.config import settings
from app.services.greeks import calculate_row_greeks
import logging

logger = logging.getLogger(__name__)


class MarketDataService:
    """
    Service to fetch and process Argentine market data from external APIs.
    Implements caching to respect rate limits (120 req/min, data updates every 20s).
    """
    
    def __init__(self):
        """Initialize with TTL cache."""
        # Cache with TTL matching API update frequency
        self._cache: TTLCache = TTLCache(maxsize=100, ttl=settings.cache_ttl_seconds)
        self._stocks_cache_key = "stocks_data"
        self._options_cache_key = "options_data"
        
    async def _fetch_stocks(self) -> List[Dict]:
        """
        Fetch stock data from external API.
        Returns list of stocks with format: [{symbol: "GGAL", c: 32.50, ...}, ...]
        """
        # Check cache first
        if self._stocks_cache_key in self._cache:
            logger.info("Returning stocks data from cache")
            return self._cache[self._stocks_cache_key]
        
        url = f"{settings.market_data_base_url}{settings.stocks_endpoint}"
        logger.info(f"Fetching stocks from: {url}")
        
        try:
            async with httpx.AsyncClient(timeout=settings.api_timeout) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                
                # Cache the result
                self._cache[self._stocks_cache_key] = data
                logger.info(f"Fetched {len(data)} stocks, cached for {settings.cache_ttl_seconds}s")
                return data
                
        except httpx.HTTPError as e:
            logger.error(f"Error fetching stocks: {e}")
            raise Exception(f"Failed to fetch stocks data: {str(e)}")
    
    async def _fetch_options(self) -> List[Dict]:
        """
        Fetch options data from external API.
        Returns list of options with format: [{ticker: "GFGC3000D", bid: 1.5, ask: 1.6, ...}, ...]
        """
        # Check cache first
        if self._options_cache_key in self._cache:
            logger.info("Returning options data from cache")
            return self._cache[self._options_cache_key]
        
        url = f"{settings.market_data_base_url}{settings.options_endpoint}"
        logger.info(f"Fetching options from: {url}")
        
        try:
            async with httpx.AsyncClient(timeout=settings.api_timeout) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                
                # Cache the result
                self._cache[self._options_cache_key] = data
                logger.info(f"Fetched {len(data)} options, cached for {settings.cache_ttl_seconds}s")
                return data
                
        except httpx.HTTPError as e:
            logger.error(f"Error fetching options: {e}")
            raise Exception(f"Failed to fetch options data: {str(e)}")
    
    def _parse_option_ticker(self, ticker: str) -> Optional[Dict[str, any]]:
        """
        Parse Argentine option ticker format: [Symbol][Type][Strike][Month]
        
        Examples:
        - GFGC3000D: GFG (Galicia), C (Call), 3000 (Strike), D (December)
        - GFGV2500E: GFG (Galicia), V (Put/Venta), 2500 (Strike), E (Month)
        - YPFC5000F: YPF, C (Call), 5000 (Strike), F (June)
        
        Args:
            ticker: Option ticker string
            
        Returns:
            Dict with: {
                'symbol': 'GFG',
                'option_type': 'call' or 'put',
                'strike': 3000.0,
                'month_code': 'D',
                'original_ticker': 'GFGC3000D'
            }
            Returns None if parsing fails.
        """
        # Pattern: 3-4 letter symbol, C/V for type, digits for strike, 1-2 letters for month
        # GFG format: GFGC3000D or GFGC3000DE (1 or 2 letter month codes)
        pattern = r'^([A-Z]{2,4})([CV])(\d+)([A-Z]{1,2})$'
        
        match = re.match(pattern, ticker.upper())
        if not match:
            logger.warning(f"Failed to parse ticker: {ticker}")
            return None
        
        symbol, type_code, strike_str, month_code = match.groups()
        
        # Determine option type: C = Call, V = Put (Venta)
        option_type = 'call' if type_code == 'C' else 'put'
        
        # Parse strike - BYMA uses different encoding formats
        # Some tickers encode decimals implicitly (97539 = 9753.9)
        # We'll normalize based on strike magnitude
        try:
            strike_raw = float(strike_str)
            
            # Heuristic: If strike has 5+ digits and is > 50000, it likely needs /10
            # This handles cases like 97539 -> 9753.9 while keeping 10154 -> 10154
            if len(strike_str) >= 5 and strike_raw > 50000:
                strike = strike_raw / 10.0
                logger.debug(f"Normalized large strike: {strike_str} -> {strike}")
            else:
                strike = strike_raw
                logger.debug(f"Parsed strike: {strike_str} -> {strike}")
                
        except ValueError:
            logger.warning(f"Invalid strike in ticker {ticker}: {strike_str}")
            return None
        
        return {
            'symbol': symbol,
            'option_type': option_type,
            'strike': strike,
            'month_code': month_code,
            'original_ticker': ticker
        }
    
    def _get_days_to_expiry(self, month_code: str) -> int:
        """
        Calculate days to expiry based on month code.
        BYMA options typically expire on specific dates.
        
        Month codes (standard BYMA):
        A=Jan, B=Feb, C=Mar, D=Apr, E=May, F=Jun,
        G=Jul, H=Aug, I=Sep, J=Oct, K=Nov, L=Dec
        
        For simplicity, assume expiry is last trading day of the month.
        """
        month_map = {
            'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6,
            'G': 7, 'H': 8, 'I': 9, 'J': 10, 'K': 11, 'L': 12
        }
        
        month = month_map.get(month_code.upper())
        if not month:
            logger.warning(f"Unknown month code: {month_code}, defaulting to 30 days")
            return 30
        
        # Get current date
        now = datetime.now()
        current_year = now.year
        
        # Determine expiry year (if month has passed, use next year)
        expiry_year = current_year if month >= now.month else current_year + 1
        
        # Assume expiry on last day of month at market close
        # For simplicity, use the last calendar day
        if month == 12:
            next_month = datetime(expiry_year + 1, 1, 1)
        else:
            next_month = datetime(expiry_year, month + 1, 1)
        
        expiry_date = next_month - timedelta(days=1)
        
        # Calculate days to expiry
        days = (expiry_date - now).days
        
        # Ensure at least 1 day (for today's expiry)
        return max(1, days)
    
    async def get_underlying_price(self, symbol: str) -> Optional[float]:
        """
        Get the current price of the underlying stock.
        
        Args:
            symbol: Stock symbol (e.g., "GGAL")
            
        Returns:
            Current price or None if not found
        """
        stocks = await self._fetch_stocks()
        
        # Find the stock by symbol
        for stock in stocks:
            if stock.get('symbol', '').upper() == symbol.upper():
                # Return the current price (field 'c' based on API spec)
                price = stock.get('c')
                if price:
                    logger.info(f"Found {symbol} price: ${price}")
                    return float(price)
        
        logger.warning(f"Stock {symbol} not found in data")
        return None
    
    async def get_option_chain(self, underlying_symbol: str) -> Dict:
        """
        Fetch and process complete option chain for a ticker.
        This is the CORE method that merges stocks + options data.
        
        Args:
            underlying_symbol: Underlying stock symbol (e.g., "GGAL")
            
        Returns:
            Dictionary with structure:
            {
                'underlying_price': 32.50,
                'timestamp': '2025-12-25T10:30:00',
                'options': [
                    {
                        'ticker': 'GFGC3000D',
                        'symbol': 'GFG',
                        'option_type': 'call',
                        'strike': 3000.0,
                        'days_to_expiry': 120,
                        'bid': 1.50,
                        'ask': 1.60,
                        'last': 1.55,
                        'volume': 1000,
                        ...
                    },
                    ...
                ]
            }
        """
        # Fetch stocks and options in parallel
        logger.info(f"Fetching option chain for {underlying_symbol}")
        stocks_task = self._fetch_stocks()
        options_task = self._fetch_options()
        
        stocks, options = await asyncio.gather(stocks_task, options_task)
        
        # 1. Get underlying price
        underlying_price = None
        for stock in stocks:
            if stock.get('symbol', '').upper() == underlying_symbol.upper():
                underlying_price = float(stock.get('c', 0))
                break
        
        if not underlying_price:
            raise ValueError(f"Underlying {underlying_symbol} not found in stocks data")
        
        logger.info(f"Underlying {underlying_symbol} price: ${underlying_price}")
        
        # 2. Determine the option symbol prefix for filtering
        # GGAL -> GFG (Grupo Financiero Galicia)
        # YPF -> YPF
        # Map common tickers to their option symbols
        symbol_map = {
            'GGAL': 'GFG',
            'YPF': 'YPF',
            'PAMP': 'PAM',
            'ALUA': 'ALU',
            'TXAR': 'TXR',
            'BBAR': 'BBR',
            'EDN': 'EDN',
            'LOMA': 'LOM',
            'MIRG': 'MIR',
            'SUPV': 'SUP',
            'TECO2': 'TEC',
            'TGSU2': 'TGS',
            'TRAN': 'TRA',
            'VALO': 'VAL',
        }
        
        option_symbol = symbol_map.get(underlying_symbol.upper(), underlying_symbol[:3].upper())
        logger.info(f"Looking for options with symbol: {option_symbol}")
        
        # 3. Filter and parse options
        parsed_options = []
        for option in options:
            # Handle both 'ticker' and 'symbol' field names from API
            ticker = option.get('ticker') or option.get('symbol', '')
            ticker = ticker.upper()
            
            # Check if this option belongs to our underlying
            parsed = self._parse_option_ticker(ticker)
            if not parsed:
                continue
            
            if parsed['symbol'] != option_symbol:
                continue
            
            # Calculate days to expiry
            days_to_expiry = self._get_days_to_expiry(parsed['month_code'])
            
            # Map API fields to our internal structure
            # API uses: px_bid, px_ask, c (current price), v (volume)
            option_data = {
                'ticker': ticker,
                'symbol': parsed['symbol'],
                'option_type': parsed['option_type'],
                'strike': parsed['strike'],
                'month_code': parsed['month_code'],
                'days_to_expiry': days_to_expiry,
                'bid': option.get('px_bid') or option.get('bid'),
                'ask': option.get('px_ask') or option.get('ask'),
                'last': option.get('c') or option.get('last'),
                'volume': option.get('v') or option.get('volume'),
                'open_interest': option.get('open_interest') or option.get('oi'),
                'underlying_price': underlying_price,
            }
            
            parsed_options.append(option_data)
        
        logger.info(f"Found {len(parsed_options)} options for {underlying_symbol}")
        
        return {
            'underlying_symbol': underlying_symbol,
            'underlying_price': underlying_price,
            'timestamp': datetime.now().isoformat(),
            'options_count': len(parsed_options),
            'options': parsed_options
        }
    
    def clear_cache(self):
        """Clear the cache manually (for testing or debugging)."""
        self._cache.clear()
        logger.info("Cache cleared")


# Global instance
market_data_service = MarketDataService()
