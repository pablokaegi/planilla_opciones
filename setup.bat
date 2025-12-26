@echo off
REM Setup script for Inky Web - Options Strategizer
REM Windows PowerShell version

echo ========================================
echo Inky Web - Options Strategizer Setup
echo ========================================
echo.

REM Check Python installation
echo [1/4] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.10+ from https://www.python.org/
    exit /b 1
)
python --version
echo.

REM Check Node.js installation
echo [2/4] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org/
    exit /b 1
)
node --version
echo.

REM Setup Backend
echo [3/4] Setting up Backend...
cd backend
echo Creating virtual environment...
python -m venv venv
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo Installing Python dependencies...
pip install -r requirements.txt
echo Backend setup complete!
cd ..
echo.

REM Setup Frontend
echo [4/4] Setting up Frontend...
cd frontend
echo Installing Node.js dependencies...
call npm install
echo Frontend setup complete!
cd ..
echo.

echo ========================================
echo Setup Complete! 🎉
echo ========================================
echo.
echo To run the application:
echo.
echo 1. Start Backend (Terminal 1):
echo    cd backend
echo    venv\Scripts\activate
echo    uvicorn main:app --reload
echo.
echo 2. Start Frontend (Terminal 2):
echo    cd frontend
echo    npm run dev
echo.
echo Then open http://localhost:3000 in your browser
echo.
pause
