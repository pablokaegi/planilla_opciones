"""
Analytics Endpoints
Handles GEX (Gamma Exposure) and Order Flow (CVD) analysis.
"""
from fastapi import APIRouter
from typing import Dict, List
import random
import math
from datetime import datetime, timedelta
from app.services.market_data import market_data_service

router = APIRouter()

@router.get("/gex/{ticker}")
async def get_gex_profile(ticker: str):
    """
    Calculates Gamma Exposure Profile.
    (Simulated logic based on real Spot Price for demonstration)
    """
    # 1. Obtener precio real
    try:
        spot = await market_data_service.get_underlying_price(ticker)
    except:
        spot = 8370.0 # Fallback

    # 2. Generar Perfil GEX (Simulación basada en Spot)
    # En producción real, esto sumaría el Gamma * OpenInterest de cada opción
    strikes = []
    base_strike = int(spot / 100) * 100
    
    total_call_gex = 0
    total_put_gex = 0
    
    for i in range(-10, 11):
        strike_px = base_strike + (i * 100)
        
        # Modelo simplificado: Más Gamma cerca del dinero (ATM)
        distance = abs(spot - strike_px)
        gamma_intensity = math.exp(-distance / 500) * 10 # Campana gaussiana
        
        # Call GEX (Dealers Short Gamma usually above spot if Calls sold)
        c_gex = gamma_intensity * random.uniform(0.5, 1.5)
        # Put GEX (Dealers Long Gamma usually below spot)
        p_gex = gamma_intensity * random.uniform(0.5, 1.5) * -1 
        
        strikes.append({
            "strike": strike_px,
            "call_gex": c_gex,
            "put_gex": p_gex,
            "total_gex": c_gex + p_gex,
            "call_oi": int(gamma_intensity * 100),
            "put_oi": int(gamma_intensity * 100)
        })
        
        total_call_gex += c_gex
        total_put_gex += p_gex

    net_gex = total_call_gex + total_put_gex
    
    return {
        "spot_price": spot,
        "flip_point": spot + random.uniform(-50, 50), # Punto donde Gamma cambia de signo
        "total_call_gex": total_call_gex,
        "total_put_gex": total_put_gex,
        "net_gex": net_gex,
        "gex_regime": "POSITIVE" if net_gex > 0 else "NEGATIVE",
        "local_gex": net_gex * 0.3, # GEX en rango cercano
        "total_vex": 15.5, # Vanna Exposure (Simulado)
        "total_cex": 5.2,  # Charm Exposure (Simulado)
        "max_pain": base_strike,
        "strikes": strikes
    }

@router.get("/flow/{ticker}")
async def get_order_flow(ticker: str):
    """
    Returns CVD (Cumulative Volume Delta) and Flow Data.
    """
    try:
        spot = await market_data_service.get_underlying_price(ticker)
    except:
        spot = 8370.0

    # Generar serie de tiempo intradía simulada para ver el gráfico
    data_points = []
    current_cvd = 0
    current_price = spot * 0.98
    
    now = datetime.now()
    start_time = now - timedelta(days=1)
    
    for i in range(50):
        time_point = start_time + timedelta(minutes=15 * i)
        
        # Random Walk
        price_change = random.uniform(-0.002, 0.002)
        current_price = current_price * (1 + price_change)
        
        # CVD suele seguir al precio, pero a veces diverge
        flow_volume = random.randint(1000, 50000)
        is_buy = random.random() > 0.45 # Ligera presión compradora
        
        net_flow = flow_volume if is_buy else -flow_volume
        current_cvd += net_flow
        
        data_points.append({
            "date": time_point.isoformat(),
            "price": current_price,
            "volume": flow_volume,
            "buy_volume": flow_volume if is_buy else 0,
            "sell_volume": 0 if is_buy else flow_volume,
            "net_flow": net_flow,
            "cvd": current_cvd
        })

    return {
        "ticker": ticker,
        "divergence": {
            "divergence": "bullish" if current_cvd > 0 and current_price < spot else "bearish",
            "price_trend": "up" if current_price > spot * 0.98 else "down",
            "cvd_trend": "up" if current_cvd > 0 else "down",
            "price_change_pct": 1.5,
            "cvd_change": current_cvd,
            "lookback_periods": 1
        },
        "data": data_points
    }

@router.get("/gex/{ticker}/levels")
async def get_key_levels(ticker: str):
    try:
        spot = await market_data_service.get_underlying_price(ticker)
    except:
        spot = 8370.0
        
    return {
        "ticker": ticker,
        "spot_price": spot,
        "levels": {
            "flip_point": spot - 20,
            "max_pain": int(spot / 100) * 100,
            "resistance": spot * 1.05,
            "support": spot * 0.95
        },
        "interpretation": {
            "above_flip": "Dealer long gamma acts as stabilizer. Low volatility expected.",
            "below_flip": "Dealer short gamma accelerates moves. High volatility expected."
        }
    }
