@echo off
title VNPT DAK LAK - HE THONG WIFI MARKETING VA CLOUDFLARE TUNNEL
color 0B
cd /d "%~dp0"

echo ==============================================================================
echo        VNPT DAK LAK - HE THONG WIFI MARKETING THONG MINH AI
echo             Khoi dong he thong Edge Computing & Cloudflare Tunnel
echo ==============================================================================
echo.
echo [1/4] Dang bat Backend Core API (Port 4000)...
start "VNPT_Backend_4000" /min cmd /c "cd apps\backend && node dist\main.js"

timeout /t 3 /nobreak >nul

echo [2/4] Dang bat Captive Portal (Port 3000)...
start "VNPT_Portal_3000" /min cmd /c "cd apps\portal && npx next start -p 3000"

timeout /t 2 /nobreak >nul

echo [3/4] Dang bat CMS Dashboard Quan Tri (Port 3001)...
start "VNPT_Dashboard_3001" /min cmd /c "cd apps\dashboard && npx next start -p 3001"

timeout /t 3 /nobreak >nul

echo [4/4] Dang ket noi Cloudflare HTTPS Tunnel ra toan cau...
echo.
echo ==============================================================================
echo >> QUAN TRONG:
echo    Doi khoang 3-5 giay, man hinh phia duoi se in ra link dang:
echo    https://xxxx-xxxx-xxxx.trycloudflare.com
echo.
echo    1. Hay COPY toan bo link https://...trycloudflare.com do
echo    2. Mo Router Ruijie Reyee, dan vao o [Portal Server URL]:
echo       Link dan vao Ruijie: https://xxxx.trycloudflare.com?venue=vnpt-daklak
echo    3. Luu lai tren Ruijie va dung dien thoai bat WiFi de trai nghiem!
echo ==============================================================================
echo.

cloudflared.exe tunnel --url http://localhost:3000
pause
