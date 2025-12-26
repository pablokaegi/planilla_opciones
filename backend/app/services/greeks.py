"""
Greeks Calculation Module - Black-Scholes Implementation
Adapted from backfill_mysql_iv.py logic
"""
from typing import Optional, Dict
import numpy as np
from py_vollib.black_scholes import black_scholes as bs_price
from py_vollib.black_scholes.greeks.analytical import delta, gamma, theta, vega
from py_vollib.black_scholes.implied_volatility import implied_volatility as bs_iv
import logging

logger = logging.getLogger(__name__)


def calculate_row_greeks(
    S: float,
    K: float,
    T: float,
    r: float,
    price: float,
    option_type: str
) -> Dict[str, Optional[float]]:
    """
    Calculate Implied Volatility and Greeks for a single option.
    
    This function replicates the logic from backfill_mysql_iv.py's calculate_iv_and_greeks.
    
    Args:
        S: Underlying spot price ($S$)
        K: Strike price ($K$)
        T: Time to expiry in years ($T$)
        r: Risk-free rate (annual, as decimal - e.g., 0.35 for 35%)
        price: Market price of the option ($Price$)
        option_type: 'C' for Call or 'V'/'P' for Put
    
    Returns:
        Dictionary containing:
        {
            'iv': float or None,
            'delta': float or None,
            'gamma': float or None,
            'theta': float or None,
            'vega': float or None,
            'error': str or None
        }
    
    Notes:
        - Returns None for Greeks if IV calculation fails
        - Handles edge cases (expired, zero price, etc.)
        - Graceful error handling for convergence issues
    """
    result = {
        'iv': None,
        'delta': None,
        'gamma': None,
        'theta': None,
        'vega': None,
        'error': None
    }
    
    # Input validation
    if S <= 0 or K <= 0:
        result['error'] = "Spot and strike prices must be positive"
        return result
    
    if price <= 0:
        result['error'] = "Market price must be positive"
        return result
    
    if T < 0:
        result['error'] = "Time to expiry cannot be negative"
        return result
    
    # Normalize option type to py_vollib format
    # 'C' or 'call' -> 'c'
    # 'V' (Venta) or 'P' or 'put' -> 'p'
    if option_type.upper() in ['C', 'CALL']:
        flag = 'c'
    elif option_type.upper() in ['V', 'P', 'PUT', 'VENTA']:
        flag = 'p'
    else:
        result['error'] = f"Invalid option type: {option_type}"
        return result
    
    # Handle expired options (T <= 0)
    if T <= 0:
        result['error'] = "Option has expired"
        # Calculate intrinsic value only
        if flag == 'c':
            intrinsic = max(S - K, 0)
            result['delta'] = 1.0 if S > K else 0.0
        else:
            intrinsic = max(K - S, 0)
            result['delta'] = -1.0 if K > S else 0.0
        
        result['gamma'] = 0.0
        result['theta'] = 0.0
        result['vega'] = 0.0
        result['iv'] = 0.0
        return result
    
    try:
        # Step 1: Calculate Implied Volatility
        # This is the core calculation - finding the volatility that makes
        # theoretical price equal to market price
        iv_value = bs_iv(
            price=price,
            S=S,
            K=K,
            t=T,
            r=r,
            flag=flag
        )
        
        # Sanity check on IV
        if iv_value < 0 or iv_value > 5.0:  # IV > 500% is unrealistic
            logger.warning(f"Unusual IV calculated: {iv_value:.4f} for S={S}, K={K}, T={T}")
        
        result['iv'] = round(iv_value, 4)
        
        # Step 2: Calculate Greeks using the calculated IV
        # All Greeks depend on the implied volatility we just found
        
        result['delta'] = round(delta(flag, S, K, T, r, iv_value), 4)
        result['gamma'] = round(gamma(flag, S, K, T, r, iv_value), 4)
        result['theta'] = round(theta(flag, S, K, T, r, iv_value), 4)
        result['vega'] = round(vega(flag, S, K, T, r, iv_value), 4)
        
        logger.debug(f"Greeks calculated successfully: IV={result['iv']:.4f}, Delta={result['delta']:.4f}")
        
    except Exception as e:
        # Common reasons for failure:
        # 1. Price is outside arbitrage bounds (too high or too low)
        # 2. IV calculation doesn't converge
        # 3. Numerical issues with very small T or extreme strikes
        error_msg = f"Greeks calculation error: {str(e)}"
        logger.warning(error_msg)
        result['error'] = error_msg
    
    return result


def calculate_theoretical_price(
    S: float,
    K: float,
    T: float,
    r: float,
    sigma: float,
    option_type: str
) -> Optional[float]:
    """
    Calculate theoretical option price given an implied volatility.
    Useful for validation or what-if scenarios.
    
    Args:
        S: Underlying spot price
        K: Strike price
        T: Time to expiry in years
        r: Risk-free rate
        sigma: Implied volatility (as decimal)
        option_type: 'C' for Call or 'V'/'P' for Put
    
    Returns:
        Theoretical price or None if calculation fails
    """
    if T <= 0:
        # Expired option - return intrinsic value
        flag = 'c' if option_type.upper() in ['C', 'CALL'] else 'p'
        if flag == 'c':
            return max(S - K, 0)
        else:
            return max(K - S, 0)
    
    # Normalize flag
    if option_type.upper() in ['C', 'CALL']:
        flag = 'c'
    elif option_type.upper() in ['V', 'P', 'PUT', 'VENTA']:
        flag = 'p'
    else:
        return None
    
    try:
        price = bs_price(flag, S, K, T, r, sigma)
        return round(price, 4)
    except Exception as e:
        logger.error(f"Error calculating theoretical price: {e}")
        return None


def validate_greeks(greeks: Dict[str, Optional[float]], option_type: str) -> bool:
    """
    Validate that calculated Greeks are within reasonable bounds.
    
    Args:
        greeks: Dictionary with calculated Greeks
        option_type: 'C' for Call or 'V'/'P' for Put
    
    Returns:
        True if Greeks pass validation, False otherwise
    """
    if greeks.get('error'):
        return False
    
    iv = greeks.get('iv')
    delta = greeks.get('delta')
    gamma = greeks.get('gamma')
    theta = greeks.get('theta')
    vega = greeks.get('vega')
    
    # Check if all values are present
    if None in [iv, delta, gamma, theta, vega]:
        return False
    
    # Validate ranges
    checks = [
        0 < iv < 5.0,  # IV between 0% and 500%
        gamma >= 0,  # Gamma always positive
        vega >= 0,  # Vega always positive
    ]
    
    # Delta bounds depend on option type
    if option_type.upper() in ['C', 'CALL']:
        checks.append(0 <= delta <= 1)
    else:
        checks.append(-1 <= delta <= 0)
    
    return all(checks)
