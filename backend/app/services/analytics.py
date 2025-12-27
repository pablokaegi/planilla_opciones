"""
Analytics Service - GEX (Gamma Exposure), VEX (Vanna Exposure), CEX (Charm Exposure) & CVD
Ported from legacy VolSmile.py logic for professional options analysis

GEX Formula: gamma * open_interest * 100 * spot_price^2 * 0.01 * direction
VEX Formula: vanna * open_interest * 100 * spot_price * 0.01 * direction (delta change per 1% IV)
CEX Formula: charm * open_interest * 100 * spot_price / 365 * direction (delta decay per day)

- Direction: +1 for Calls (dealers are short calls = long gamma when hedging)
- Direction: -1 for Puts (dealers are short puts = short gamma when hedging)
- Results scaled to Millions for readability

CVD Formula: Cumulative sum of (Buy Volume - Sell Volume)
- Uses tick rule: Close > Prev Close = Buy, Close < Prev Close = Sell
- Enhanced: Lee-Ready classification when bid/ask available
"""
import logging
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class GexStrike:
    """GEX data for a single strike"""
    strike: float
    call_gex: float
    put_gex: float
    total_gex: float
    call_oi: int
    put_oi: int
    call_gamma: float
    put_gamma: float
    # Enhanced fields from VolSmile.py
    vex: float = 0.0  # Vanna Exposure
    cex: float = 0.0  # Charm Exposure
    moneyness: str = "OTM"  # ITM, ATM, OTM


@dataclass 
class GexProfile:
    """Complete GEX profile for an underlying"""
    spot_price: float
    flip_point: Optional[float]  # Strike where cumulative GEX flips sign
    total_call_gex: float
    total_put_gex: float
    net_gex: float
    strikes: List[GexStrike]
    max_pain: Optional[float]  # Strike with max dealer pain
    # Enhanced fields
    total_vex: float = 0.0
    total_cex: float = 0.0
    gex_regime: str = "NEUTRAL"  # POSITIVE, NEGATIVE, NEUTRAL
    local_gex: float = 0.0  # GEX within ±5% of spot


@dataclass
class FlowDataPoint:
    """Single data point for order flow analysis"""
    date: str
    price: float
    volume: int
    buy_volume: int
    sell_volume: int
    net_flow: int
    cvd: float


class AnalyticsService:
    """
    Service for advanced options analytics:
    - Gamma Exposure (GEX) Profile
    - Vanna Exposure (VEX) - sensitivity to IV changes
    - Charm Exposure (CEX) - delta decay over time
    - Cumulative Volume Delta (CVD) / Order Flow
    
    Based on professional trading methodology from VolSmile.py
    """
    
    # Scaling factors
    GEX_SCALE = 1_000_000  # Scale to millions
    VEX_SCALE = 1_000_000  # Scale to millions  
    CEX_SCALE = 1_000      # Scale to thousands
    CONTRACT_SIZE = 100     # Standard options multiplier
    
    def _classify_moneyness(self, strike: float, spot_price: float) -> str:
        """Classify option by moneyness (ITM, ATM, OTM)"""
        ratio = strike / spot_price
        if ratio < 0.95:
            return "ITM"
        elif ratio > 1.05:
            return "OTM"
        else:
            return "ATM"
    
    def calculate_single_gex(
        self,
        gamma: float,
        open_interest: int,
        spot_price: float,
        is_call: bool
    ) -> float:
        """
        Calculate GEX for a single option contract.
        
        Formula (from VolSmile.py): gamma * OI * 100 * spot^2 * 0.01 * direction
        
        Args:
            gamma: Option's gamma value
            open_interest: Number of open contracts
            spot_price: Current underlying price
            is_call: True for calls, False for puts
            
        Returns:
            GEX value in dollars (scaled to millions)
        """
        if gamma is None or gamma == 0 or open_interest == 0:
            return 0.0
        
        # Direction: Dealers are typically SHORT options
        # - Short Calls = LONG Gamma (positive GEX)
        # - Short Puts = SHORT Gamma (negative GEX)
        direction = 1.0 if is_call else -1.0
        
        # GEX Formula from VolSmile.py
        gex = gamma * open_interest * self.CONTRACT_SIZE * (spot_price ** 2) * 0.01 * direction
        
        return gex / self.GEX_SCALE
    
    def calculate_single_vex(
        self,
        vanna: float,
        open_interest: int,
        spot_price: float,
        is_call: bool
    ) -> float:
        """
        Calculate VEX (Vanna Exposure) for a single option.
        
        VEX = Vanna * OI * 100 * Spot * 0.01 (delta change per 1% IV change)
        
        If IV rises 1%, dealers need to adjust delta by VEX amount.
        """
        if vanna is None or vanna == 0 or open_interest == 0:
            return 0.0
        
        direction = 1.0 if is_call else -1.0
        vex = vanna * open_interest * self.CONTRACT_SIZE * spot_price * 0.01 * direction
        
        return vex / self.VEX_SCALE
    
    def calculate_single_cex(
        self,
        charm: float,
        open_interest: int,
        spot_price: float,
        is_call: bool
    ) -> float:
        """
        Calculate CEX (Charm Exposure) for a single option.
        
        CEX = Charm * OI * 100 * Spot / 365 (daily delta decay)
        
        Each day, dealers need to adjust delta by CEX amount (pin effect).
        """
        if charm is None or charm == 0 or open_interest == 0:
            return 0.0
        
        direction = 1.0 if is_call else -1.0
        cex = charm * open_interest * self.CONTRACT_SIZE * spot_price / 365.0 * direction
        
        return cex / self.CEX_SCALE
    
    def calculate_gex_profile(
        self,
        options_data: List[Dict],
        spot_price: float
    ) -> GexProfile:
        """
        Calculate complete GEX profile from options chain data.
        Enhanced with VEX, CEX, moneyness, and regime detection from VolSmile.py.
        
        Args:
            options_data: List of option contracts with gamma, OI, strike, type
            spot_price: Current underlying price
            
        Returns:
            GexProfile with per-strike GEX, VEX, CEX and flip point
        """
        # Group options by strike
        strikes_map: Dict[float, Dict] = {}
        
        for opt in options_data:
            strike = opt.get('strike', 0)
            if strike <= 0:
                continue
                
            if strike not in strikes_map:
                strikes_map[strike] = {
                    'call_gamma': 0, 'put_gamma': 0,
                    'call_oi': 0, 'put_oi': 0,
                    'call_gex': 0, 'put_gex': 0,
                    'call_vanna': 0, 'put_vanna': 0,
                    'call_charm': 0, 'put_charm': 0,
                    'vex': 0, 'cex': 0
                }
            
            gamma = opt.get('gamma', 0) or 0
            oi = opt.get('open_interest', 0) or opt.get('oi', 0) or 0
            vanna = opt.get('vanna', 0) or 0
            charm = opt.get('charm', 0) or 0
            opt_type = opt.get('option_type', opt.get('type', '')).lower()
            
            is_call = opt_type == 'call'
            gex = self.calculate_single_gex(gamma, oi, spot_price, is_call)
            vex = self.calculate_single_vex(vanna, oi, spot_price, is_call)
            cex = self.calculate_single_cex(charm, oi, spot_price, is_call)
            
            if is_call:
                strikes_map[strike]['call_gamma'] = gamma
                strikes_map[strike]['call_oi'] = oi
                strikes_map[strike]['call_gex'] = gex
                strikes_map[strike]['call_vanna'] = vanna
                strikes_map[strike]['call_charm'] = charm
            else:
                strikes_map[strike]['put_gamma'] = gamma
                strikes_map[strike]['put_oi'] = oi
                strikes_map[strike]['put_gex'] = gex
                strikes_map[strike]['put_vanna'] = vanna
                strikes_map[strike]['put_charm'] = charm
            
            strikes_map[strike]['vex'] += vex
            strikes_map[strike]['cex'] += cex
        
        # Build GexStrike objects sorted by strike
        gex_strikes: List[GexStrike] = []
        sorted_strikes = sorted(strikes_map.keys())
        
        for strike in sorted_strikes:
            data = strikes_map[strike]
            moneyness = self._classify_moneyness(strike, spot_price)
            
            gex_strike = GexStrike(
                strike=strike,
                call_gex=data['call_gex'],
                put_gex=data['put_gex'],
                total_gex=data['call_gex'] + data['put_gex'],
                call_oi=data['call_oi'],
                put_oi=data['put_oi'],
                call_gamma=data['call_gamma'],
                put_gamma=data['put_gamma'],
                vex=data['vex'],
                cex=data['cex'],
                moneyness=moneyness
            )
            gex_strikes.append(gex_strike)
        
        # Calculate totals
        total_call_gex = sum(s.call_gex for s in gex_strikes)
        total_put_gex = sum(s.put_gex for s in gex_strikes)
        net_gex = total_call_gex + total_put_gex
        total_vex = sum(s.vex for s in gex_strikes)
        total_cex = sum(s.cex for s in gex_strikes)
        
        # Find Gamma Flip Point (where cumulative GEX crosses zero)
        flip_point = self._find_flip_point(gex_strikes, spot_price)
        
        # Find Max Pain (strike where total OI is highest)
        max_pain = self._find_max_pain(gex_strikes)
        
        # Calculate local GEX (±5% of spot) for regime detection
        local_range_low = spot_price * 0.95
        local_range_high = spot_price * 1.05
        local_gex = sum(
            s.total_gex for s in gex_strikes 
            if local_range_low <= s.strike <= local_range_high
        )
        
        # Determine GEX regime
        if flip_point and spot_price < flip_point:
            gex_regime = "NEGATIVE"  # Dealers SHORT gamma = acceleration
        elif flip_point and spot_price > flip_point:
            gex_regime = "POSITIVE"  # Dealers LONG gamma = stabilization
        else:
            gex_regime = "NEUTRAL"
        
        return GexProfile(
            spot_price=spot_price,
            flip_point=flip_point,
            total_call_gex=total_call_gex,
            total_put_gex=total_put_gex,
            net_gex=net_gex,
            strikes=gex_strikes,
            max_pain=max_pain,
            total_vex=total_vex,
            total_cex=total_cex,
            gex_regime=gex_regime,
            local_gex=local_gex
        )
    
    def _find_flip_point(self, gex_strikes: List[GexStrike], spot_price: float) -> Optional[float]:
        """
        Find the Gamma Flip Point - where cumulative GEX crosses zero.
        
        Enhanced logic from VolSmile.py:
        - Calculates cumulative GEX and finds zero crossings
        - If multiple crossings, returns the one closest to spot price
        - Filters noise from deep OTM strikes
        
        This is significant because:
        - Above flip point: Dealers are net LONG gamma (stabilizing)
        - Below flip point: Dealers are net SHORT gamma (amplifying moves)
        """
        if not gex_strikes:
            return None
        
        # Calculate cumulative GEX and find zero crossings
        cumsum = 0.0
        zero_crossings = []
        
        for i, gex_strike in enumerate(gex_strikes):
            prev_cumsum = cumsum
            cumsum += gex_strike.total_gex
            
            # Check for sign change (crossing zero)
            if i > 0 and prev_cumsum * cumsum < 0:
                # Linear interpolation to find exact flip point
                if abs(cumsum - prev_cumsum) > 0.0001:
                    prev_strike = gex_strikes[i - 1].strike
                    ratio = abs(prev_cumsum) / abs(cumsum - prev_cumsum)
                    flip_strike = prev_strike + ratio * (gex_strike.strike - prev_strike)
                else:
                    flip_strike = gex_strike.strike
                zero_crossings.append(flip_strike)
        
        if zero_crossings:
            # Return the flip point closest to current spot price
            # This filters noise from deep ITM/OTM strikes
            return min(zero_crossings, key=lambda x: abs(x - spot_price))
        
        # Fallback: If no zero crossing, find strike with minimum absolute cumulative GEX
        # This represents the "balance point" even if it doesn't cross zero
        min_abs_cum = float('inf')
        flip_point = None
        cumsum = 0.0
        
        for gex_strike in gex_strikes:
            cumsum += gex_strike.total_gex
            if abs(cumsum) < min_abs_cum:
                min_abs_cum = abs(cumsum)
                flip_point = gex_strike.strike
        
        return flip_point
    
    def _find_max_pain(self, gex_strikes: List[GexStrike]) -> Optional[float]:
        """
        Find Max Pain strike (simplified: highest total OI).
        
        Max Pain theory: Price tends to gravitate toward strike with max OI
        because it minimizes payout to option holders.
        """
        if not gex_strikes:
            return None
        
        max_oi = 0
        max_pain_strike = None
        
        for gex_strike in gex_strikes:
            total_oi = gex_strike.call_oi + gex_strike.put_oi
            if total_oi > max_oi:
                max_oi = total_oi
                max_pain_strike = gex_strike.strike
        
        return max_pain_strike
    
    def calculate_cvd_profile(
        self,
        historical_data: List[Dict]
    ) -> List[FlowDataPoint]:
        """
        Calculate Cumulative Volume Delta (CVD) from OHLCV data.
        Enhanced with Lee-Ready classification when bid/ask available.
        
        Methods (from VolSmile.py):
        1. Lee-Ready: If bid/ask available, use price location in spread
           - Price >= 0.6 of spread = Buy (Lifting Ask)
           - Price <= 0.4 of spread = Sell (Hitting Bid)
        2. Tick Rule: Fallback when no bid/ask
           - Close > Previous Close → Buy
           - Close < Previous Close → Sell
        
        Args:
            historical_data: List of candles [{date, open, high, low, close, volume, bid, ask}, ...]
            
        Returns:
            List of FlowDataPoint with CVD values
        """
        if not historical_data or len(historical_data) < 2:
            return []
        
        flow_data: List[FlowDataPoint] = []
        cumulative_cvd = 0.0
        prev_close = historical_data[0].get('close', 0)
        prev_direction = 1  # Start assuming buy
        
        for i, candle in enumerate(historical_data):
            date = candle.get('date', candle.get('timestamp', f'T{i}'))
            close = candle.get('close', 0)
            volume = candle.get('volume', 0)
            bid = candle.get('bid', candle.get('bid_price', None))
            ask = candle.get('ask', candle.get('ask_price', None))
            last_price = candle.get('last', close)
            
            # Method 1: Lee-Ready classification (if bid/ask available)
            if bid is not None and ask is not None and bid > 0 and ask > bid:
                spread = ask - bid
                price_location = (last_price - bid) / spread
                price_location = max(0, min(1, price_location))  # Clamp to [0, 1]
                
                if price_location >= 0.6:
                    direction = 1  # Buy (Lifting Ask)
                elif price_location <= 0.4:
                    direction = -1  # Sell (Hitting Bid)
                else:
                    direction = prev_direction  # Neutral, use previous
            else:
                # Method 2: Tick Rule (fallback)
                if close > prev_close:
                    direction = 1  # Buy
                elif close < prev_close:
                    direction = -1  # Sell
                else:
                    direction = prev_direction  # Unchanged
            
            # Classify volume
            if direction == 1:
                buy_volume = volume
                sell_volume = 0
            else:
                buy_volume = 0
                sell_volume = volume
            
            # Calculate net flow and update CVD
            net_flow = buy_volume - sell_volume
            cumulative_cvd += net_flow
            
            flow_point = FlowDataPoint(
                date=str(date),
                price=close,
                volume=volume,
                buy_volume=buy_volume,
                sell_volume=sell_volume,
                net_flow=net_flow,
                cvd=cumulative_cvd
            )
            flow_data.append(flow_point)
            
            # Update for next iteration
            prev_close = close
            prev_direction = direction
        
        return flow_data
    
    def calculate_cvd_divergence(
        self,
        flow_data: List[FlowDataPoint],
        lookback: int = 10
    ) -> Dict:
        """
        Detect price-CVD divergences for trading signals.
        
        Bullish Divergence: Price making lower lows, CVD making higher lows
        Bearish Divergence: Price making higher highs, CVD making lower highs
        
        Args:
            flow_data: CVD data from calculate_cvd_profile
            lookback: Number of periods to analyze
            
        Returns:
            Dict with divergence analysis
        """
        if len(flow_data) < lookback:
            return {'divergence': None, 'strength': 0}
        
        recent = flow_data[-lookback:]
        
        # Price trend (simple: compare first and last)
        price_start = recent[0].price
        price_end = recent[-1].price
        price_trend = 'up' if price_end > price_start else 'down'
        
        # CVD trend
        cvd_start = recent[0].cvd
        cvd_end = recent[-1].cvd
        cvd_trend = 'up' if cvd_end > cvd_start else 'down'
        
        # Detect divergence
        divergence = None
        if price_trend == 'down' and cvd_trend == 'up':
            divergence = 'bullish'
        elif price_trend == 'up' and cvd_trend == 'down':
            divergence = 'bearish'
        
        # Calculate strength (how much they diverge)
        price_change_pct = (price_end - price_start) / price_start * 100 if price_start else 0
        cvd_change = cvd_end - cvd_start
        
        return {
            'divergence': divergence,
            'price_trend': price_trend,
            'cvd_trend': cvd_trend,
            'price_change_pct': round(price_change_pct, 2),
            'cvd_change': cvd_change,
            'lookback_periods': lookback
        }


# Singleton instance
analytics_service = AnalyticsService()
