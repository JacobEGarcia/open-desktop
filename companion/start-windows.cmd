@echo off
cd /d "%~dp0.."
where node >nul 2>nul || (echo Install Node.js LTS first. & pause & exit /b 1)
node companion\server.js
pause
