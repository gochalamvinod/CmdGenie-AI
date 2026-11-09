@echo off
title CmdGenie AI (Admin Mode)
cd /d "%~dp0"

:: Check for Administrative permissions
net session >nul 2>&1
if %errorLevel% == 0 (
    call "%~dp0start.bat"
    exit /b
) else (
    echo [ELEVATING] Requesting Windows Administrator privileges via UAC...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/k \"\"%~dp0start.bat\"\"' -Verb RunAs"
    exit /b
)
