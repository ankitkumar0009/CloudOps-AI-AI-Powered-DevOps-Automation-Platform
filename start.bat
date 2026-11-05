@echo off
title CloudOps AI 2.0 - Platform Orchestrator
cd /d "%~dp0"
echo ======================================================================
echo   CLOUDOPS AI 2.0 - AUTONOMOUS DEVOPS & INFRASTRUCTURE PLATFORM
echo ======================================================================
echo Starting all 4 platform tiers:
echo   - Frontend Web Console:       http://localhost:3000
echo   - FastAPI Backend API:        http://127.0.0.1:8000
echo   - Swagger API Documentation:  http://127.0.0.1:8000/docs
echo   - Prometheus Metrics Stream:  http://localhost:9090
echo   - Grafana Portal:             http://localhost:3001
echo ======================================================================
echo.

if exist ".python\python.exe" (
    start "" "http://localhost:3000"
    .\.python\python.exe run_platform.py
) else (
    start "" "http://localhost:3000"
    python run_platform.py
)
pause

