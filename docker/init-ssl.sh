#!/bin/bash
# ========================================================
# Script Khởi Tạo Chứng Chỉ SSL Let's Encrypt Tự Động
# VNPT Đắk Lắk WiFi Marketing Platform
# ========================================================

set -e

DOMAINS=("portal.daklak.vnpt.vn" "admin.daklak.vnpt.vn")
EMAIL="cntt.daklak@vnpt.vn"
DATA_PATH="./certbot"

echo "🔒 [SSL SETUP] Bắt đầu khởi tạo chứng chỉ SSL cho VNPT Đắk Lắk..."

# Tạo thư mục chứng chỉ nếu chưa có
mkdir -p "$DATA_PATH/conf/live/${DOMAINS[0]}"
mkdir -p "$DATA_PATH/conf/live/${DOMAINS[1]}"
mkdir -p "$DATA_PATH/www"

# Tạo chứng chỉ giả lập (dummy certificate) để Nginx có thể khởi động lần đầu
for domain in "${DOMAINS[@]}"; do
  cert_path="$DATA_PATH/conf/live/$domain"
  if [ ! -f "$cert_path/fullchain.pem" ]; then
    echo "🔑 Đang tạo chứng chỉ tạm thời (Self-Signed) cho $domain..."
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
      -keyout "$cert_path/privkey.pem" \
      -out "$cert_path/fullchain.pem" \
      -subj "/CN=localhost"
  fi
done

echo "🚀 Khởi động Nginx tạm thời..."
docker compose -f docker-compose.prod.yml up -d nginx

# Xóa chứng chỉ tạm và xin chứng chỉ thật từ Let's Encrypt
for domain in "${DOMAINS[@]}"; do
  echo "🌐 Đang xin cấp chứng chỉ SSL chính thức từ Let's Encrypt cho $domain..."
  docker compose -f docker-compose.prod.yml run --rm --entrypoint "\
    certbot certonly --webroot -w /var/www/certbot \
      --email $EMAIL \
      -d $domain \
      --rsa-key-size 4096 \
      --agree-tos \
      --force-renewal \
      --non-interactive" certbot
done

echo "🔄 Reload Nginx với chứng chỉ SSL chính thức..."
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo "🎉 [HOÀN TẤT] Hệ thống đã được bảo vệ bởi HTTPS / SSL chính thức!"
