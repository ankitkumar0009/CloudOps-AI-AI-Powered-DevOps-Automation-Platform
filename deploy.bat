@echo off
title CloudOps AI 2.0 - GitHub Pages Deployer
cd /d "%~dp0"
echo ======================================================================
echo   CLOUDOPS AI 2.0 - GITHUB PAGES DEPLOYMENT
echo ======================================================================
echo.
echo [1/4] Building production frontend with 3D background...
call npm run build --prefix frontend
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend build failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/4] Setting up SPA 404 fallback and .nojekyll...
copy /y "frontend\dist\index.html" "frontend\dist\404.html" >nul
type nul > "frontend\dist\.nojekyll"

echo.
echo [3/4] Packaging gh-pages deployment bundle...
pushd "frontend\dist"
if exist ".git" rd /s /q ".git"
git init >nul
git branch -M gh-pages >nul
git add -A >nul
git commit -m "deploy: automated release to GitHub Pages" >nul
git remote add origin https://github.com/ankitkumar0009/CloudOps-AI-AI-Powered-DevOps-Automation-Platform.git >nul

echo.
echo [4/4] Pushing to GitHub (branch: gh-pages)...
git push -f origin gh-pages
rd /s /q ".git"
popd

echo.
echo ======================================================================
echo   DEPLOYMENT COMPLETE!
echo   Live URL: https://ankitkumar0009.github.io/CloudOps-AI-AI-Powered-DevOps-Automation-Platform/
echo ======================================================================
pause
