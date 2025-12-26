"""
Pydantic Models for Data Validation
"""
from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime


class OptionInput(BaseModel):
    """Input model for calculating Greeks on a single option."""
    
    spot_price: float = Field(..., gt=0, description="Current underlying price")
    strike: float = Field(..., gt=0, description="Strike price")
    days_to_expiry: int = Field(..., ge=0, description="Days until expiration")
    option_type: Literal["call", "put"] = Field(..., description="Option type")
    market_price: float = Field(..., gt=0, description="Market price of the option")
    risk_free_rate: Optional[float] = Field(None, description="Risk-free rate (annual)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "spot_price": 100.0,
                "strike": 105.0,
                "days_to_expiry": 30,
                "option_type": "call",
                "market_price": 3.50,
                "risk_free_rate": 0.05
            }
        }


class OptionGreeks(BaseModel):
    """Output model with calculated Greeks and IV."""
    
    iv: Optional[float] = Field(None, description="Implied Volatility")
    delta: Optional[float] = Field(None, description="Delta")
    gamma: Optional[float] = Field(None, description="Gamma")
    theta: Optional[float] = Field(None, description="Theta")
    vega: Optional[float] = Field(None, description="Vega")
    error: Optional[str] = Field(None, description="Error message if calculation failed")


class OptionChainRow(BaseModel):
    """Single row in the option chain."""
    
    strike: float
    
    # Call side
    call_bid: Optional[float] = None
    call_ask: Optional[float] = None
    call_last: Optional[float] = None
    call_volume: Optional[int] = None
    call_open_interest: Optional[int] = None
    call_iv: Optional[float] = None
    call_delta: Optional[float] = None
    call_gamma: Optional[float] = None
    call_theta: Optional[float] = None
    call_vega: Optional[float] = None
    
    # Put side
    put_bid: Optional[float] = None
    put_ask: Optional[float] = None
    put_last: Optional[float] = None
    put_volume: Optional[int] = None
    put_open_interest: Optional[int] = None
    put_iv: Optional[float] = None
    put_delta: Optional[float] = None
    put_gamma: Optional[float] = None
    put_theta: Optional[float] = None
    put_vega: Optional[float] = None


class OptionChainResponse(BaseModel):
    """Response model for option chain data."""
    
    ticker: str
    spot_price: float
    timestamp: datetime
    expiration_date: str
    days_to_expiry: int
    chain: list[OptionChainRow]
