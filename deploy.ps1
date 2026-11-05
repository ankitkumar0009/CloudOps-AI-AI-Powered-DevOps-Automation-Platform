# CloudOps AI 2.0 - GitHub Pages Deployment Script
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  CLOUDOPS AI 2.0 - GITHUB PAGES DEPLOYMENT" -ForegroundColor Cyan
Write-Host "======================================================================`n" -ForegroundColor Cyan

Write-Host "[1/4] Building production frontend with 3D background..." -ForegroundColor Yellow
& npm run build --prefix frontend

Write-Host "`n[2/4] Setting up SPA 404 fallback and .nojekyll..." -ForegroundColor Yellow
Copy-Item "frontend\dist\index.html" "frontend\dist\404.html" -Force
New-Item -ItemType File -Path "frontend\dist\.nojekyll" -Force | Out-Null

Write-Host "`n[3/4] Packaging gh-pages deployment bundle..." -ForegroundColor Yellow
Push-Location "frontend\dist"
if (Test-Path ".git") { Remove-Item -Recurse -Force ".git" }
& git init | Out-Null
& git branch -M gh-pages | Out-Null
& git add -A | Out-Null
& git commit -m "deploy: automated release to GitHub Pages" | Out-Null
& git remote add origin https://github.com/ankitkumar0009/CloudOps-AI-AI-Powered-DevOps-Automation-Platform.git | Out-Null

Write-Host "`n[4/4] Pushing to GitHub (branch: gh-pages)..." -ForegroundColor Yellow
& git push -f origin gh-pages
Remove-Item -Recurse -Force ".git"
Pop-Location

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "  Live URL: https://ankitkumar0009.github.io/CloudOps-AI-AI-Powered-DevOps-Automation-Platform/" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
