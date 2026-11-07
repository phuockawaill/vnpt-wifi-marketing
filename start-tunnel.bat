@echo off
title VNPT Dak Lak WiFi Marketing - Cloudflare Tunnel
cd /d "%~dp0"
echo ==========================================================
echo  VNPT DAK LAK - KHOI TAO CLOUDFLARE HTTPS TUNNEL
echo ==========================================================
echo.
echo Dang khoi dong Cloudflare Tunnel tro ve Port 3000...
echo.
echo >> HUONG DAN:
echo Sau vai giay, man hinh se hien ra link dang:
echo https://xxxx-xxxx-xxxx.trycloudflare.com
echo.
echo Hay COPY link nay va dan vao o [Portal Server URL] tren Ruijie Reyee!
echo ==========================================================
echo.
cloudflared.exe tunnel --url http://localhost:3000
pause
