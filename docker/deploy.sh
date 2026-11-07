#!/bin/bash
# ========================================================
# Script Tự Động Triển Khai Production (1-Click Deploy)
# Hệ thống WiFi Marketing VNPT Đắk Lắk
# ========================================================

set -e

echo "🚀 [VNPT ĐẮK LẮK] Bắt đầu quá trình Build & Triển khai Production..."

# Kiểm tra file .env.production
if [ ! -f .env.production ]; then
    echo "⚠️ Chưa tìm thấy file .env.production! Đang tạo từ template mẫu..."
    cp .env.production.example .env.production
fi

# Chuyển CSDL sang PostgreSQL
echo "🗄️ Cấu hình Backend sang chế độ PostgreSQL & Redis..."
cd ..
npm run use:postgres
cd docker

# Build và khởi động các container Docker
echo "🐳 Đang build các Docker Image (Backend, Portal, Dashboard, Nginx)..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Chờ Postgres khởi động
echo "⏳ Chờ cơ sở dữ liệu PostgreSQL sẵn sàng..."
docker compose -f docker-compose.prod.yml exec backend npx prisma db push --schema=prisma/schema.prisma

# Nạp dữ liệu khởi tạo VNPT Đắk Lắk
echo "🌱 Nạp dữ liệu mẫu ban đầu cho tỉnh Đắk Lắk..."
docker compose -f docker-compose.prod.yml exec backend npx ts-node prisma/seed.sqlite.ts || true

echo "✅ [THÀNH CÔNG] Hệ thống WiFi Marketing VNPT Đắk Lắk đã sẵn sàng trên Production!"
echo "👉 Cổng Chào Portal: https://portal.daklak.vnpt.vn"
echo "👉 CMS Quản Trị: https://admin.daklak.vnpt.vn"
