# ========================================================
# Script Kh?i ?ng Cloudflare Tunnel Mi-n PhA-
# H? th?`ng WiFi Marketing VNPT ?_k L_k
# ========================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  VNPT ?_K L_K - KH?I T?O CLOUDFLARE HTTPS TUNNEL" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $SCRIPT_DIR

$CLOUDFLARED = Join-Path $SCRIPT_DIR "cloudflared.exe"

if (-not (Test-Path $CLOUDFLARED)) {
    Write-Host "[!] Dang ti file cloudflared.exe t clouflare..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $CLOUDFLARED -UseBasicParsing
}

Write-Host "[1/3] Ki-m tra file thit k: cloudflared.exe ... [OK]" -ForegroundColor Green
Write-Host "[2/3] ?ang kh?i t?o Cloud HTTPS Tunnel v? Port 3000 (Portal VNPT)..." -ForegroundColor Yellow
Write-Host ""
Write-Host ">> LU Y QUAN TR?NG:" -ForegroundColor Magenta
Write-Host "   Sau vAi giAy, mAn hAnh s- xut hi-n m?t dong cA3 dng:" -ForegroundColor White
Write-Host "   https://xxxx-xxxx-xxxx.trycloudflare.com" -ForegroundColor Green
Write-Host ""
Write-Host "   Hy COPY link HTTPS dA3 vA dAn vAo A 'Portal Server URL' trAAn Ruijie Reyee!" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

& $CLOUDFLARED tunnel --url http://localhost:3000
