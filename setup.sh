#!/bin/bash

# Setup script for Inky Web - Options Strategizer
# Linux/Mac version

echo "========================================"
echo "Inky Web - Options Strategizer Setup"
echo "========================================"
echo ""

# Check Python installation
echo "[1/4] Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 is not installed"
    echo "Please install Python 3.10+ from https://www.python.org/"
    exit 1
fi
python3 --version
echo ""

# Check Node.js installation
echo "[2/4] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi
node --version
echo ""

# Setup Backend
echo "[3/4] Setting up Backend..."
cd backend
echo "Creating virtual environment..."
python3 -m venv venv
echo "Activating virtual environment..."
source venv/bin/activate
echo "Installing Python dependencies..."
pip install -r requirements.txt
echo "Backend setup complete!"
cd ..
echo ""

# Setup Frontend
echo "[4/4] Setting up Frontend..."
cd frontend
echo "Installing Node.js dependencies..."
npm install
echo "Frontend setup complete!"
cd ..
echo ""

echo "========================================"
echo "Setup Complete! 🎉"
echo "========================================"
echo ""
echo "To run the application:"
echo ""
echo "1. Start Backend (Terminal 1):"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   uvicorn main:app --reload"
echo ""
echo "2. Start Frontend (Terminal 2):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"
echo ""
