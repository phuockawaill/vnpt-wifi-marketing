#!/bin/sh
set -e

echo "=========================================================="
echo " VNPT Đắk Lắk WiFi Marketing Platform - Production Start"
echo "=========================================================="

echo "[1/3] Checking Database connectivity & applying Prisma schema..."
npx prisma db push --schema=prisma/schema.prisma --accept-data-loss

echo "[2/3] Seeding initial VNPT Đắk Lắk Data if needed..."
node dist/database/seed.js || npx ts-node prisma/seed.ts || true

echo "[3/3] Launching NestJS Core API Engine on Port ${PORT:-4000}..."
exec node dist/main.js
