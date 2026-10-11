@echo off
cd /d "%~dp0"
where python >nul 2>nul
if %errorlevel% neq 0 (
  echo Python was not found. Install Python or serve this folder with any static HTTP server.
  pause
  exit /b 1
)
start "" http://localhost:8000/web/index.html
python -m http.server 8000
