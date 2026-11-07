@echo off
title Day Code Len GitHub - VNPT Dak Lak
color 0A
cd /d "%~dp0"
echo ==============================================================================
echo        DAY MA NGUON LEN GITHUB (vnpt-wifi-marketing)
echo ==============================================================================
echo.
echo Repo cua ban: https://github.com/phuockawaill/vnpt-wifi-marketing.git
echo.
echo >> HUONG DAN NHAP TOKEN:
echo    GitHub yeu cau Personal Access Token (PAT) de xac thuc quyen day code.
echo    1. Neu chua co token, mo link sau tren trinh duyet:
echo       https://github.com/settings/tokens/new
echo    2. Dat ten bat ky (VD: vnpt), tich chon o [repo], keo xuong bam Generate token.
echo    3. Copy ma token vua tao (dang: ghp_xxxx...).
echo.
set /p GH_TOKEN="Nhap/Dan GitHub Token (ghp_...) cua ban vao day: "

if "%GH_TOKEN%"=="" (
    echo [!] Ban chua nhap Token!
    pause
    exit /b
)

echo.
echo Dang day ma nguon len GitHub...
git.cmd push https://%GH_TOKEN%@github.com/phuockawaill/vnpt-wifi-marketing.git main

echo.
echo ==============================================================================
echo [HOAN TAT] Code da duoc day len GitHub thanh cong!
echo Bay gio ban vao https://dashboard.render.com -> New + -> Blueprint de Deploy!
echo ==============================================================================
pause
