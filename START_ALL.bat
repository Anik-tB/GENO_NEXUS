@echo off
title GenoNexus - Full Stack Launcher
color 0A

echo ============================================
echo   GENO NEXUS - Starting All Services
echo ============================================
echo.

:: ---- 1. Genomics Engine (Port 8000) ----
echo [1/3] Starting Genomics Engine on port 8000...
start "Genomics Engine :8000" cmd /k "cd /d %~dp0microservices\genomics_engine && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
timeout /t 2 /nobreak > nul

:: ---- 2. Epidemiology Engine (Port 8001) ----
echo [2/3] Starting Epidemiology Engine on port 8001...
start "Epidemiology Engine :8001" cmd /k "cd /d %~dp0microservices\epidemiology && python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload"
timeout /t 2 /nobreak > nul

:: ---- 3. Next.js Frontend (Port 3000) ----
echo [3/3] Starting Next.js Frontend on port 3000...
start "GenoNexus Frontend :3000" cmd /k "cd /d %~dp0 && npm run dev"
timeout /t 3 /nobreak > nul

echo.
echo ============================================
echo   All services launched!
echo   Frontend:    http://localhost:3000
echo   Genomics:    http://localhost:8000/docs
echo   Epidemiology:http://localhost:8001/docs
echo ============================================
echo.
echo Opening browser...
timeout /t 5 /nobreak > nul
start http://localhost:3000

pause
