# Enterprise WiFi Marketing Platform

Hệ thống WiFi Marketing toàn diện hỗ trợ đa chi nhánh (Multi-venue) và tích hợp trực tiếp với các dòng thiết bị mạng phổ biến nhất: **MikroTik RouterOS**, **Ubiquiti UniFi**, **Ruijie Reyee Cloud**.

## 🌟 Tính Năng Nổi Bật

1. **Captive Portal Đa Dạng Chiến Dịch**:
   - 📺 **Banner đếm ngược** (Countdown 5-15s trước khi mở mạng).
   - 🎬 **Video quảng cáo** (Bắt buộc xem hết để nhận mã/mở kết nối).
   - 📋 **Thu thập Lead** (Họ tên, Số điện thoại, Email, Giới tính, Nhóm tuổi).
   - ⭐ **Khảo sát đánh giá** (Survey 1-5 sao, câu hỏi trắc nghiệm dịch vụ/món ăn).
   - 📱 **Zalo ZNS / Social Login** (Xác thực tài khoản hoặc gửi mã OTP qua Zalo).
   - ⚡ **One-Click Connect** (Trang chào tối giản bấm mở mạng tức thì).

2. **Hỗ Trợ Đa Dòng Router & Access Point**:
   - **MikroTik RouterOS**: Tương thích Hotspot, RouterOS REST API, IP-Binding bypass, Radius.
   - **Ubiquiti UniFi**: Tích hợp trực tiếp qua UniFi Controller API (`authorize-guest`).
   - **Ruijie Reyee**: Tích hợp qua Ruijie Cloud OpenAPI (MACC) và Local Web Auth.

3. **Admin Dashboard Quản Trị & Báo Cáo**:
   - Quản lý nhiều địa điểm (Venues/Branches) tập trung.
   - Trình tạo chiến dịch quảng cáo kéo thả, phân lịch theo khung giờ (sáng/trưa/tối).
   - Thống kê lượt hiển thị (Impressions), tỷ lệ click (CTR), thời lượng sử dụng trung bình.
   - Quản lý danh sách khách hàng (Leads) & Lịch sử quay lại (Returning visitors), xuất file Excel/CSV.

---

## 🏗️ Cấu Trúc Dự Án (Monorepo)

- **`apps/backend`**: API Server xây dựng bằng **NestJS**, tích hợp Prisma ORM, Redis, BullMQ và Gateway Adapters.
- **`apps/portal`**: Trang chào Captive Portal tối ưu cực nhẹ (Lightweight SSR / HTML5 / Tailwind), tải trang dưới 1 giây trên mobile, tương thích Apple CNA & Android Captive Portal.
- **`apps/dashboard`**: Giao diện CMS quản trị dành cho Marketer và Quản lý chi nhánh (Next.js App Router, Tailwind CSS, Lucide Icons).
- **`packages/shared`**: Các DTO, Interfaces, Enums dùng chung giữa Backend và UI.
- **`docker/`**: Môi trường Docker Compose cho PostgreSQL, Redis.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Môi Trường Phát Triển

Hệ thống hỗ trợ 2 chế độ cơ sở dữ liệu linh hoạt:

### ⚡ Chế độ 1: Siêu Tốc (SQLite + In-Memory Cache) - KHÔNG CẦN CÀI ĐẶT GÌ THÊM
Phù hợp nhất để chạy thử nghiệm, demo hoặc phát triển nhanh trên máy tính cá nhân mà **không cần cài PostgreSQL, không cần Redis, không cần Docker hay Router thật**:
```bash
# 1. Chuyển sang chế độ SQLite (Tự động nạp schema & dữ liệu mẫu)
npm run use:sqlite

# 2. Khởi động toàn bộ ứng dụng
npm run dev:backend
```
- Cơ sở dữ liệu SQLite cục bộ được lưu tại: `apps/backend/prisma/dev.db`.
- Tự động kích hoạt **In-Memory Cache** (thay thế Redis) và **Mock Router Gateway** (giả lập cấp quyền mạng).

---

### 🏢 Chế độ 2: Doanh Nghiệp (PostgreSQL + Redis + Router Thật)
Phù hợp cho môi trường Staging / Production quy mô lớn:
```bash
# 1. Khởi động PostgreSQL & Redis qua Docker
cd docker
docker-compose up -d
cd ..

# 2. Chuyển sang chế độ PostgreSQL
npm run use:postgres

# 3. Đẩy schema và dữ liệu mẫu
npm run db:push
npm run db:seed
```

---

## 🌐 Các Cổng Dịch Vụ Mặc Định
- **Captive Portal (Trang Chào Khách)**: `http://localhost:3000`
- **Dashboard CMS (Quản Trị)**: `http://localhost:3001`
- **Backend Core API**: `http://localhost:4000`
- **Tài liệu Swagger API**: `http://localhost:4000/docs`

