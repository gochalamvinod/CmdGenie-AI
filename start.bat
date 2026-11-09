@echo off
title CmdGenie AI
cd /d "%~dp0"

:: 1. Check Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found in PATH!
    echo Please install Python from python.org and check "Add Python to PATH".
    pause
    exit /b 1
)

:: 2. Check Node
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js / npm is not found in PATH!
    pause
    exit /b 1
)

:: 3. Setup Python venv if missing
if not exist "backend\venv\Scripts\python.exe" (
    echo [INFO] Setting up Python virtual environment...
    python -m venv backend\venv
    backend\venv\Scripts\pip.exe install -r backend\requirements.txt
)

:: 4. Setup frontend modules if missing
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend packages...
    cd frontend
    call npm install
    cd ..
)

:: 5. Launch both Backend & Frontend in THIS SINGLE WINDOW (No extra popups!)
backend\venv\Scripts\python.exe run.py
