"""
Options Pricing Engine - Calculate IV and Greeks
Based on Black-Scholes model using py_vollib
"""
from typing import Optional, Dict, Any
import numpy as np
from py_vollib.black_scholes import black_scholes as bs_price
from py_vollib.black_scholes.greeks.analytical import delta, gamma, theta, vega
from py_vollib.black_scholes.implied_volatility import implied_volatility as bs_iv
from app.core.config import settings


class PricingEngine:
    """
    Calculate implied volatility and Greeks for options using Black-Scholes model.
    """
    
    def __init__(self, default_risk_free_rate: Optional[float] = None):
        """
        Initialize pricing engine.
        
        Args:
            default_risk_free_rate: Default risk-free rate if not provided per calculation
        """
        self.default_risk_free_rate = default_risk_free_rate or settings.default_risk_free_rate
    
    def calculate_iv_and_greeks(
        self,
        spot_price: float,
        strike: float,
        days_to_expiry: int,
        option_type: str,
        market_price: float,
        risk_free_rate: Optional[float] = None
    ) -> Dict[str, Optional[float]]:
        """
        Calculate implied volatility and all Greeks for a single option.
        
        Args:
            spot_price: Current price of underlying asset
            strike: Strike price of the option
            days_to_expiry: Days until expiration
            option_type: 'call' or 'put'
            market_price: Current market price of the option
            risk_free_rate: Annual risk-free rate (defaults to configured rate)
            
        Returns:
            Dictionary with keys: iv, delta, gamma, theta, vega
            Returns None for values if calculation fails
        """
        result = {
            "iv": None,
            "delta": None,
            "gamma": None,
            "theta": None,
            "vega": None,
            "error": None
        }
        
        # Input validation
        if days_to_expiry < 0:
            result["error"] = "Days to expiry cannot be negative"
            return result
        
        if spot_price <= 0 or strike <= 0 or market_price <= 0:
            result["error"] = "Prices must be positive"
            return result
        
        if option_type not in ['call', 'put', 'c', 'p']:
            result["error"] = f"Invalid option type: {option_type}"
            return result
        
        # Normalize option type
        flag = 'c' if option_type.lower().startswith('c') else 'p'
        
        # Use provided rate or default
        r = risk_free_rate if risk_free_rate is not None else self.default_risk_free_rate
        
        # Convert days to years (time to expiration)
        t = days_to_expiry / 365.0
        
        # Handle expired options
        if t <= 0:
            result["error"] = "Option has expired"
            # For expired options, intrinsic value only
            intrinsic = max(spot_price - strike, 0) if flag == 'c' else max(strike - spot_price, 0)
            result["delta"] = 1.0 if (flag == 'c' and spot_price > strike) else 0.0
            result["gamma"] = 0.0
            result["theta"] = 0.0
            result["vega"] = 0.0
            result["iv"] = 0.0
            return result
        
        try:
            # Calculate implied volatility
            # py_vollib expects: S, K, t, r, market_price, flag
            iv_value = bs_iv(
                price=market_price,
                S=spot_price,
                K=strike,
                t=t,
                r=r,
                flag=flag
            )
            result["iv"] = round(iv_value, 4)
            
            # Calculate Greeks using the calculated IV
            result["delta"] = round(delta(flag, spot_price, strike, t, r, iv_value), 4)
            result["gamma"] = round(gamma(flag, spot_price, strike, t, r, iv_value), 4)
            result["theta"] = round(theta(flag, spot_price, strike, t, r, iv_value), 4)
            result["vega"] = round(vega(flag, spot_price, strike, t, r, iv_value), 4)
            
        except Exception as e:
            result["error"] = f"Calculation error: {str(e)}"
            
        return result
    
    def calculate_theoretical_price(
        self,
        spot_price: float,
        strike: float,
        days_to_expiry: int,
        option_type: str,
        implied_vol: float,
        risk_free_rate: Optional[float] = None
    ) -> Optional[float]:
        """
        Calculate theoretical option price given an implied volatility.
        
        Args:
            spot_price: Current price of underlying asset
            strike: Strike price of the option
            days_to_expiry: Days until expiration
            option_type: 'call' or 'put'
            implied_vol: Implied volatility to use
            risk_free_rate: Annual risk-free rate
            
        Returns:
            Theoretical price or None if calculation fails
        """
        if days_to_expiry < 0:
            return None
        
        flag = 'c' if option_type.lower().startswith('c') else 'p'
        r = risk_free_rate if risk_free_rate is not None else self.default_risk_free_rate
        t = days_to_expiry / 365.0
        
        if t <= 0:
            # Intrinsic value for expired options
            return max(spot_price - strike, 0) if flag == 'c' else max(strike - spot_price, 0)
        
        try:
            price = bs_price(flag, spot_price, strike, t, r, implied_vol)
            return round(price, 2)
        except Exception:
            return None


# Global instance
pricing_engine = PricingEngine()
