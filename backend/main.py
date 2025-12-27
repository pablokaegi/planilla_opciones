"""
Inky Web - Options Strategizer API
FastAPI Backend Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import endpoints, analytics # <--- Importa analytics

# Initialize FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Professional Options Chain Analysis and Strategy Builder API",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS - "Nuclear Option" para Desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # <--- CAMBIO CRÍTICO: Permitir todo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(endpoints.router, prefix="/api/v1", tags=["options"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"]) # <--- Agrega esta línea


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "status": "running"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
