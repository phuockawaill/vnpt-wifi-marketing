@echo off
title Dung He Thong WiFi Marketing VNPT Dak Lak
color 0C
cd /d "%~dp0"

echo ==============================================================================
echo        DUNG HE THONG WIFI MARKETING VNPT DAK LAK
echo ==============================================================================
echo.
echo Dang tat cac tien trinh dang chay (Node.js, Cloudflared)...

taskkill /F /FI "WINDOWTITLE eq VNPT_Backend_4000*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq VNPT_Portal_3000*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq VNPT_Dashboard_3001*" >nul 2>&1
taskkill /F /IM cloudflared.exe >nul 2>&1

echo.
echo [DA DUNG] Toan bo he thong da duoc tat sach se!
echo ==============================================================================
echo.
pause
