@echo off
title VNPT Dak Lak WiFi Marketing - Khoi Dong He Thong
cd /d "%~dp0"
echo ==========================================================
echo  KHOI DONG HE THONG WIFI MARKETING VNPT DAK LAK
echo ==========================================================
echo.
echo [1/3] Khoi dong Backend Core API (Port 4000)...
start "VNPT Backend" cmd /k "cd apps\backend && node dist\main.js"

timeout /t 3 /nobreak >nul

echo [2/3] Khoi dong Captive Portal (Port 3000)...
start "VNPT Portal" cmd /k "cd apps\portal && npx next start -p 3000"

timeout /t 2 /nobreak >nul

echo [3/3] Khoi dong CMS Dashboard (Port 3001)...
start "VNPT Dashboard" cmd /k "cd apps\dashboard && npx next start -p 3001"

echo.
echo ==========================================================
echo [HOAN TAT] Tat ca 3 dich vu da duoc bat thanh cong!
echo - Portal Khach hang: http://localhost:3000
echo - CMS Quan tri:      http://localhost:3001
echo - Backend API Docs:  http://localhost:4000/docs
echo ==========================================================
echo.
pause
