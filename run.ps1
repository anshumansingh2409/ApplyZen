Write-Host "========================================================" -ForegroundColor Green
Write-Host "       Starting ApplyZen AI Career Operating System      " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend
Write-Host "`n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\backend'; .\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

# Start Frontend
Write-Host "[2/2] Starting React + Vite Frontend on http://127.0.0.1:5173 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\frontend'; npm run dev"

Write-Host "`nApplyZen is launching!" -ForegroundColor Green
Write-Host "Frontend URL: http://127.0.0.1:5173" -ForegroundColor Yellow
Write-Host "Backend Docs: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
