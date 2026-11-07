# ========================================================
# Script Tự Động Triển Khai Production (Windows Server)
# Hệ thống WiFi Marketing VNPT Đắk Lắk
# ========================================================

Write-Host "🚀 [VNPT ĐẮK LẮK] Bắt đầu quá trình Build & Triển khai Production..." -ForegroundColor Cyan

# Kiểm tra file .env.production
if (-not (Test-Path .env.production)) {
    Write-Host "⚠️ Chưa tìm thấy file .env.production! Đang tạo từ template mẫu..." -ForegroundColor Yellow
    Copy-Item .env.production.example .env.production
}

# Chuyển CSDL sang PostgreSQL
Write-Host "🗄️ Cấu hình Backend sang chế độ PostgreSQL & Redis..." -ForegroundColor Cyan
Set-Location ..
npm run use:postgres
Set-Location docker

# Build và khởi động Docker Containers
Write-Host "🐳 Đang build các Docker Image (Backend, Portal, Dashboard, Nginx)..." -ForegroundColor Cyan
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Đồng bộ schema vào PostgreSQL
Write-Host "⏳ Đồng bộ bảng dữ liệu vào PostgreSQL..." -ForegroundColor Cyan
docker compose -f docker-compose.prod.yml exec backend npx prisma db push --schema=prisma/schema.prisma

Write-Host "✅ [THÀNH CÔNG] Hệ thống WiFi Marketing VNPT Đắk Lắk đã sẵn sàng trên Production!" -ForegroundColor Green
Write-Host "👉 Cổng Chào Portal: https://portal.daklak.vnpt.vn" -ForegroundColor Cyan
Write-Host "👉 CMS Quản Trị: https://admin.daklak.vnpt.vn" -ForegroundColor Cyan
