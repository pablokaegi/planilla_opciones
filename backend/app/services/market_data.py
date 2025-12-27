"""
Market Data Service for Argentine Options (BYMA/Merval)
Handles fetching, parsing, caching, and merging stock + option data

This is THE CORE ENGINE that:
1. Fetches stocks + options concurrently (async)
2. Extracts GGAL underlying price (Spot)
3. Parses GFG option tickers (handles AB, FE, EN, decimal strikes)
4. Merges data and calculates Greeks using Black-Scholes
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

# Configuración del Logger
logger = logging.getLogger(__name__)


class MarketDataService:
    """
    Service to fetch and process Argentine market data from external APIs.
    Implements caching to respect rate limits (120 req/min, data updates every 20s).
    Acts as a Pricing Engine calculating Greeks for every option.
    """
    
    def __init__(self):
        """Initialize with TTL cache and Risk Parameters."""
        # Cache with TTL matching API update frequency
        self._cache: TTLCache = TTLCache(maxsize=100, ttl=settings.cache_ttl_seconds)
        self._stocks_cache_key = "stocks_data"
        self._options_cache_key = "options_data"
        
        # --- PARAMETRO CRÍTICO DE MERCADO ---
        # Tasa Libre de Riesgo Argentina (Badlar / Tasa de Poltica Monetaria)
        # Actualizado: 26% (0.26) para reflejar condiciones de mercado reales.
        # Esto es fundamental para que el cálculo de IV y Griegas (Theta/Rho) sea preciso.
        self.risk_free_rate = 0.26 
        
    async def _fetch_stocks(self) -> List[Dict]:
        """
        Fetch stock data from external API.
        Returns list of stocks with format: [{symbol: "GGAL", c: 32.50, ...}, ...]
        """
        # 1. Verificar Caché
        if self._stocks_cache_key in self._cache:
            # logger.info("Returning stocks data from cache")
            return self._cache[self._stocks_cache_key]
        
        url = f"{settings.market_data_base_url}{settings.stocks_endpoint}"
        logger.info(f"Fetching stocks from: {url}")

        # logger.warning("[DEBUG] Realizando fetch de STOCKS a la API externa (no cache)")
        
        try:
            async with httpx.AsyncClient(timeout=settings.api_timeout) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                
                # 2. Guardar en Caché
                self._cache[self._stocks_cache_key] = data
                logger.info(f"Fetched {len(data)} stocks, cached for {settings.cache_ttl_seconds}s")
                return data
                
        except httpx.HTTPError as e:
            logger.error(f"Error fetching stocks: {e}")
            # En producción, podrías querer devolver datos cacheados viejos si falla la red
            raise Exception(f"Failed to fetch stocks data: {str(e)}")
    
    async def _fetch_options(self) -> List[Dict]:
        """
        Fetch options data from external API.
        Returns list of options with format: [{ticker: "GFGC3000D", bid: 1.5, ask: 1.6, ...}, ...]
        """
        # 1. Verificar Caché
        if self._options_cache_key in self._cache:
            # logger.info("Returning options data from cache")
            return self._cache[self._options_cache_key]
        
        url = f"{settings.market_data_base_url}{settings.options_endpoint}"
        logger.info(f"Fetching options from: {url}")

        # logger.warning("[DEBUG] Realizando fetch de OPTIONS a la API externa (no cache)")
        
        try:
            async with httpx.AsyncClient(timeout=settings.api_timeout) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                
                # 2. Guardar en Caché
                self._cache[self._options_cache_key] = data
                logger.info(f"Fetched {len(data)} options, cached for {settings.cache_ttl_seconds}s")
                return data
                
        except httpx.HTTPError as e:
            logger.error(f"Error fetching options: {e}")
            raise Exception(f"Failed to fetch options data: {str(e)}")
    
    def _parse_option_ticker(self, ticker: str) -> Optional[Dict[str, any]]:
        """
        Parse Argentine option ticker format: [Symbol][Type][Strike][Month]
        Handles various BYMA formats observed in production.
        
        Examples handled:
        - GFGC3000D (Classic): GFG, Call, 3000, Dec
        - GFGC8000.FE (Dot Month): GFG, Call, 8000, Feb
        - GFGC9753.9AB (Decimal Strike): GFG, Call, 9753.9, Apr
        - GFGC97539AB (Implied Decimal): GFG, Call, 9753.9, Apr
        
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
        ticker = ticker.upper().strip()
        
        # Lista de Patrones Regex para manejar la inconsistencia de BYMA
        patterns = [
            # Pattern 1: Formato Clásico (GFGC3000D)
            # Grupo 1: Symbol, 2: Type, 3: Strike, 4: Month (1-2 letras)
            r'^([A-Z]{2,4})([CV])(\d+)([A-Z]{1,2})$',
            
            # Pattern 2: Formato con Punto en Mes (GFGC8000.FE)
            r'^([A-Z]{2,4})([CV])(\d+\.?\d*)\.([A-Z]{2})$',
            
            # Pattern 3: Formato Decimal sin separador claro (Strike con decimales implícitos)
            r'^([A-Z]{2,4})([CV])(\d+\.?\d*)([A-Z]{2})$',
        ]
        
        match = None
        pattern_used = 0
        
        for i, pattern in enumerate(patterns):
            match = re.match(pattern, ticker)
            if match:
                pattern_used = i
                break
        
        if not match:
            # logger.debug(f"Failed to parse ticker: {ticker}") 
            return None
        
        groups = match.groups()
        
        if len(groups) == 4:
            symbol, type_code, strike_str, month_code = groups
        else:
            # Fallback seguro por si el regex devuelve grupos inesperados
            return None
        
        # Normalizar Tipo: C = Call, V = Put (Venta)
        option_type = 'call' if type_code == 'C' else 'put'
        
        # Parsear Strike con lógica de negocio para decimales
        try:
            strike = float(strike_str)
            
            # REGLA HEURÍSTICA DE BYMA (CRÍTICA):
            # Algunos proveedores de datos envían el strike multiplicado por 10 o 100 sin punto.
            # Ejemplo: 97539 para un strike de 9753.9.
            # Lógica: Si el strike es > 20,000 (y GGAL vale ~8,000), es probable que sea un error de escala.
            # Ajustamos dividiendo por 10 si no tiene punto decimal explícito.
            if strike > 20000 and '.' not in strike_str:
                strike = strike / 10.0
                # logger.debug(f"Normalized large strike: {strike_str} -> {strike}")
                
        except ValueError:
            # logger.warning(f"Invalid strike in ticker {ticker}: {strike_str}")
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
        """
        month_code = month_code.upper()
        
        # Mapa de 1 letra (Estándar tradicional)
        month_map_single = {
            'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6,
            'G': 7, 'H': 8, 'I': 9, 'J': 10, 'K': 11, 'L': 12
        }
        
        # Mapa de 2 y 3 letras (Estándar "criollo" / explícito)
        month_map_double = {
            'EN': 1, 'FE': 2, 'MA': 3, 'AB': 4, 'MY': 5, 'JU': 6,
            'JL': 7, 'AG': 8, 'SE': 9, 'OC': 10, 'NO': 11, 'DI': 12,
            # Variaciones comunes
            'ENE': 1, 'FEB': 2, 'MAR': 3, 'ABR': 4, 'MAY': 5, 'JUN': 6,
            'JUL': 7, 'AGO': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DIC': 12,
            'MR': 3, 'JA': 1, 'FB': 2
        }
        
        # Intentar resolver el mes
        month = month_map_double.get(month_code) or month_map_single.get(month_code)
        
        if not month:
            # Si no reconocemos el mes, devolvemos 30 días por defecto para no romper el cálculo de Griegas
            return 30
        
        # Obtener fecha actual
        now = datetime.now()
        current_year = now.year
        
        # Determinar año de vencimiento
        # Si el mes es menor al actual, asumimos que es del año siguiente
        expiry_year = current_year
        if month < now.month:
            expiry_year += 1
        elif month == now.month:
            # Si es el mismo mes, verificar si ya pasamos el día 15 (vencimiento aprox)
            # Esto es una simplificación, idealmente se usaría un calendario de feriados
            if now.day > 20: 
                 pass 

        # Estimación: Día 15 del mes a las 17:00hs (Cierre de mercado)
        try:
            expiry_date = datetime(expiry_year, month, 15, 17, 0, 0)
        except ValueError:
            # Fallback para fin de año o fechas inválidas
            expiry_date = datetime(expiry_year, month, 1) + timedelta(days=28)
            
        # Calcular días restantes
        days = (expiry_date - now).days
        
        # Asegurar al menos 1 día para evitar división por cero en fórmulas
        return max(1, days)
    
    async def get_underlying_price(self, symbol: str) -> Optional[float]:
        """
        Get the current price of the underlying stock (Spot).
        
        Args:
            symbol: Stock symbol (e.g., "GGAL")
            
        Returns:
            Current price or None if not found
        """
        stocks = await self._fetch_stocks()
        
        # Buscar por símbolo exacto
        for stock in stocks:
            if stock.get('symbol', '').upper() == symbol.upper():
                # Retornar el precio actual (campo 'c' en API BYMA)
                price = stock.get('c')
                if price:
                    # logger.info(f"Found {symbol} price: ${price}")
                    return float(price)
        
        logger.warning(f"Stock {symbol} not found in data")
        return None
    
    async def get_option_chain(self, underlying_symbol: str) -> Dict:
        """
        Fetch and process complete option chain for a ticker.
        This is the CORE method that merges stocks + options data AND calculates Greeks.
        
        Args:
            underlying_symbol: Underlying stock symbol (e.g., "GGAL")
            
        Returns:
            Dictionary with structure ready for API consumption.
        """
        # Fetch concurrente de acciones y opciones
        logger.info(f"Fetching option chain for {underlying_symbol}")
        stocks_task = self._fetch_stocks()
        options_task = self._fetch_options()
        
        stocks, options = await asyncio.gather(stocks_task, options_task)
        
        # 1. Obtener precio del subyacente (Spot)
        underlying_price = None
        for stock in stocks:
            if stock.get('symbol', '').upper() == underlying_symbol.upper():
                underlying_price = float(stock.get('c', 0))
                break
        
        if not underlying_price:
            raise ValueError(f"Underlying {underlying_symbol} not found in stocks data")
        
        # logger.info(f"Underlying {underlying_symbol} price: ${underlying_price}")
        
        # 2. Determinar prefijo de símbolo para filtrado
        # Mapeo de tickers comunes a sus raíces de opciones
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
        # logger.info(f"Looking for options with symbol: {option_symbol}")
        
        # 3. Filtrar, Parsear y Enriquecer Opciones
        parsed_options = []
        for option in options:
            # Manejar nombres de campos de API (ticker vs symbol)
            ticker = option.get('ticker') or option.get('symbol', '')
            ticker = ticker.upper()
            
            # Check si la opción pertenece a nuestro subyacente
            parsed = self._parse_option_ticker(ticker)
            if not parsed:
                continue
            
            if parsed['symbol'] != option_symbol:
                continue
            
            # Calcular días al vencimiento
            days_to_expiry = self._get_days_to_expiry(parsed['month_code'])
            
            # --- PRICING ENGINE (CÁLCULO DE GRIEGAS) ---
            
            # Obtener datos de mercado crudos
            bid = float(option.get('px_bid') or option.get('bid') or 0)
            ask = float(option.get('px_ask') or option.get('ask') or 0)
            last = float(option.get('c') or option.get('last') or 0)
            
            # CRITICAL UPDATE: ALWAYS USE LAST PRICE
            # En el mercado argentino, las puntas (bid/ask) suelen estar muy abiertas (Wide Spreads).
            # Usar el precio medio puede dar valores teóricos irreales.
            # Priorizamos 'last' (último precio operado) como el dato más firme ("Hard Data").
            market_price = last
            
            # Calcular Griegas solo si tenemos un precio de mercado válido y un spot
            greeks = {}
            if market_price > 0 and underlying_price > 0:
                try:
                    # Llamada al motor Black-Scholes
                    # Time to expiry se anualiza dividiendo por 365.0
                    greeks = calculate_row_greeks(
                        spot_price=underlying_price,
                        strike_price=parsed['strike'],
                        time_to_expiry=days_to_expiry / 365.0,
                        risk_free_rate=self.risk_free_rate, # Usa el 26% definido en __init__
                        option_type=parsed['option_type'],
                        market_price=market_price
                    )
                except Exception as e:
                    logger.warning(f"Error calculating Greeks for {ticker}: {e}")
                    # Si falla, greeks queda vacío y no rompe el loop
            
            # Mapear campos de API a estructura interna
            option_data = {
                'ticker': ticker,
                'symbol': parsed['symbol'],
                'option_type': parsed['option_type'],
                'strike': parsed['strike'],
                'month_code': parsed['month_code'],
                'days_to_expiry': days_to_expiry,
                'bid': bid,
                'ask': ask,
                'last': last,
                'volume': option.get('v') or option.get('volume') or 0,
                'open_interest': option.get('q_op') or option.get('open_interest') or option.get('oi') or 0,
                'bid_size': option.get('q_bid') or 0,
                'ask_size': option.get('q_ask') or 0,
                'underlying_price': underlying_price,
                
                # --- INYECCIÓN DE GRIEGAS ---
                'delta': greeks.get('delta'),
                'gamma': greeks.get('gamma'),
                'theta': greeks.get('theta'),
                'vega': greeks.get('vega'),
                'iv': greeks.get('iv')
            }
            
            parsed_options.append(option_data)
        
        logger.info(f"Processed {len(parsed_options)} options for {underlying_symbol}")
        
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