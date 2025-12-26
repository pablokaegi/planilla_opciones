# Quick Start Testing Script
# Run this after installing dependencies

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   INKY WEB BACKEND - QUICK TEST" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if in backend directory
if (-not (Test-Path "main.py")) {
    Write-Host "ERROR: Run this script from the backend directory!" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    Write-Host "Expected: .../inky_web/backend" -ForegroundColor Yellow
    exit 1
}

# Check if venv exists
if (-not (Test-Path "venv")) {
    Write-Host "[1/5] Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "✓ Virtual environment created" -ForegroundColor Green
} else {
    Write-Host "[1/5] Virtual environment exists ✓" -ForegroundColor Green
}

# Activate venv
Write-Host "[2/5] Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"
Write-Host "✓ Virtual environment activated" -ForegroundColor Green

# Install dependencies
Write-Host "[3/5] Installing dependencies..." -ForegroundColor Yellow
pip install -q -r requirements.txt
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Check if .env exists
Write-Host "[4/5] Checking configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "⚠ .env file not found, copying from .env.example" -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Created .env file (edit with your API URL)" -ForegroundColor Green
} else {
    Write-Host "✓ .env file exists" -ForegroundColor Green
}

# Start server in background
Write-Host "[5/5] Starting server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   SERVER STARTING" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "API will be available at:" -ForegroundColor White
Write-Host "  • Main API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "  • API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  • Test Endpoint (mock): http://localhost:8000/api/v1/chain/ggal?use_mock=true" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press CTRL+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start uvicorn
uvicorn main:app --reload
