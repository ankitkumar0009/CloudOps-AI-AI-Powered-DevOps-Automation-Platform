# CloudOps AI 2.0 - PowerShell Launcher
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  CLOUDOPS AI 2.0 - AUTONOMOUS DEVOPS & INFRASTRUCTURE PLATFORM" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Starting all 4 platform tiers:" -ForegroundColor Yellow
Write-Host "  - Frontend Web Console:       http://localhost:3000" -ForegroundColor Green
Write-Host "  - FastAPI Backend API:        http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "  - Swagger API Documentation:  http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "  - Prometheus Metrics Stream:  http://localhost:9090" -ForegroundColor Green
Write-Host "  - Grafana Portal:             http://localhost:3001" -ForegroundColor Green
Write-Host "======================================================================`n" -ForegroundColor Cyan

Start-Process "http://localhost:3000"

if (Test-Path ".\.python\python.exe") {
    & ".\.python\python.exe" "run_platform.py"
} else {
    python "run_platform.py"
}

