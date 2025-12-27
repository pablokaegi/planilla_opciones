"""
Application Configuration
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, computed_field
from typing import List


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    
    app_name: str = "Inky Web - Options Strategizer (Merval/BYMA)"
    app_version: str = "1.0.0"
    debug: bool = True
    
    # CORS settings - simple string that we'll split
    cors_origins_str: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000,http://192.168.1.39:3000,http://localhost:3001,http://127.0.0.1:3001",
        validation_alias="CORS_ORIGINS"
    )
    
    # Argentine market risk-free rate (annual percentage)
    # Using 35% for ARS (adjust based on current BADLAR or similar)
    default_risk_free_rate: float = 0.35  # 35% annual
    
    # External Market Data API Endpoints
    # Set these in .env file or environment variables
    market_data_base_url: str = "https://api.example.com"  # Replace with actual base URL
    stocks_endpoint: str = "/live/arg_stocks"
    options_endpoint: str = "/live/arg_options"
    
    # Cache settings (API updates every 20s, rate limit: 120 req/min)
    cache_ttl_seconds: int = 20
    
    # Timeout for external API calls (seconds)
    api_timeout: int = 10
    
    @computed_field
    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins_str.split(',')]


settings = Settings()
