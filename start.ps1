# CmdGenie AI - Single-Window PowerShell Launcher
[CmdletBinding()]
param(
    [switch]$Admin
)

Set-Location $PSScriptRoot

if ($Admin) {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
        exit
    }
}

# 1. Check Python
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Error "Python not found in PATH! Please install Python 3.10+ from python.org"
    pause
    exit 1
}

# 2. Check Node
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm not found in PATH! Please install Node.js from nodejs.org"
    pause
    exit 1
}

# 3. Setup venv if missing
if (-not (Test-Path "backend\venv\Scripts\python.exe")) {
    python -m venv backend\venv
    & "backend\venv\Scripts\pip.exe" install -r backend\requirements.txt
}

# 4. Setup node_modules if missing
if (-not (Test-Path "frontend\node_modules")) {
    Set-Location frontend
    npm install
    Set-Location ..
}

# 5. Run single-window unified server
& "backend\venv\Scripts\python.exe" run.py
