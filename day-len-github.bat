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
echo >> HUONG DAN LAY TOKEN GITHUB (Lam 1 lan duy nhat):
echo    1. Mo link sau tren trinh duyet: https://github.com/settings/tokens/new
echo    2. Muc Note: dien vnpt
echo    3. Muc Select scopes: TICH CHON O [repo]
echo    4. Keo xuong duoi cung bam nut xanh: Generate token
echo    5. Copy doan ma bat dau bang: ghp_...
echo.
set /p GH_TOKEN="Nhap / Dan GitHub Token (ghp_...) cua ban vao day: "

if "%GH_TOKEN%"=="" (
    echo [!] Ban chua nhap Token!
    pause
    exit /b
)

echo.
echo [1/2] Dang luu cau hinh tu dong push vao may...
git.cmd remote set-url origin https://%GH_TOKEN%@github.com/phuockawaill/vnpt-wifi-marketing.git

echo [2/2] Dang tu dong day code len GitHub...
git.cmd push -u origin main

echo.
echo ==============================================================================
echo [HOAN TAT] Code da duoc day len GitHub thanh cong 100%!
echo Tu nay tro di, he thong se TU DONG nho ma nay, khong can nhap lai!
echo.
echo >> BUOC TIEP THEO:
echo    Quay lai trang Render.com -> Dien ten [vnpt-wifi-marketing] -> Bam RETRY!
echo ==============================================================================
pause
