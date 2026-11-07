@echo off
title Day Code Len GitHub - VNPT Dak Lak
color 0A
cd /d "%~dp0"
echo ==========================================================
echo        DAY MA NGUON LEN GITHUB DE DEPLOY RENDER.COM
echo ==========================================================
echo.
set /p REPO_URL="Nhap link GitHub Repository cua ban (VD: https://github.com/ten-ban/vnpt-wifi.git): "
if "%REPO_URL%"=="" (
    echo [!] Ban chua nhap link!
    pause
    exit /b
)
git.cmd remote remove origin >nul 2>&1
git.cmd remote add origin %REPO_URL%
git.cmd branch -M main
echo.
echo Dang day code len GitHub...
git.cmd push -u origin main
echo.
echo ==========================================================
echo [XONG] Code da duoc day len GitHub thanh cong!
echo Bay gio ban vao Render.com -> New + -> Blueprint -> Chon repo de Deploy!
echo ==========================================================
pause
