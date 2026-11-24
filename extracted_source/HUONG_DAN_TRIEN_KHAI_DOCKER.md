# HƯỚNG DẪN DỰNG LẠI HỆ THỐNG GENEX MARKETING BẰNG DOCKER

Hệ thống được trích xuất trực tiếp từ máy ảo **SERVER MARKETING-0.vmdk** (Ubuntu 18.04 LTS).

---

## 1. Cấu trúc thư mục trích xuất

Thư mục: `D:\OneDrive\Máy tính\WiFi\extracted_source\`

- **`ads-production/`**: Mã nguồn lõi (Core Backend LoopBack 3, Portal Gateway, PM2 clusters, GrapesJS Builder, AngularJS Client).
  - `server/`: API endpoints, models (`ad.js`, `device.js`, `tracking.js`, `voucher.js`, `location.js`, `select-option.js`).
  - `dist/`: Toàn bộ 5.931 tệp đã build sẵn (Webpack JS/CSS bundle, server production binary).
  - `tasks/`: Kịch bản khởi tạo database (`tasks/init-db.js`, `tasks/migate-to-ads2/init-es.sh`).
- **`ads-get-usage/`**: Microservice NestJS thu thập lưu lượng sử dụng của từng khách hàng từ FreeRADIUS MySQL.
- **`cloudcmd/`**: Trình quản trị tệp tin Web phục vụ upload banner, video quảng cáo vào `/data/asset`.
- **`server_configs/`**: Cấu hình nguyên bản từ máy chủ:
  - `nginx/`: Cấu hình reverse proxy cho domain `wifidian.vnptbinhduong.vn` và `filedian.vnptbinhduong.vn`.
  - `freeradius/`: Cấu hình FreeRADIUS 3.0 kết nối MySQL AAA.
  - `mongodb/`, `redis/`, `elasticsearch/`: Thông số port và bảo mật.
- **`Dockerfile.ads-production`**: Dockerfile đóng gói ứng dụng `ads-production` chạy với Node 12 & PM2 Runtime.
- **`docker-compose.genex.yml`**: Tệp Compose dựng toàn bộ stack đồng bộ.

---

## 2. Thông số kết nối & Cổng dịch vụ (Mặc định đồng bộ với VM)

| Dịch vụ | Container Name | Cổng Host | Tài khoản / Mật khẩu |
| :--- | :--- | :--- | :--- |
| **Ads Production App** | `genex-ads-app` | `9080` | Quản trị web portal & API |
| **MongoDB 4.4** | `genex-mongodb` | `52718` | `root` / `ctinBDDTSM0nGo` (db: `db`) |
| **Redis 5.0** | `genex-redis` | `56381` | pass: `ctinBDR3dis!@#qwe123` |
| **Elasticsearch 5.6** | `genex-elasticsearch`| `59200` | (chứa index phân tích `ads2-v1`) |
| **MySQL 5.7** | `genex-mysql` | `3306` | `radius` / `Genexwifi@2022` |
| **CloudCMD File Manager**| `genex-cloudcmd` | `8085` | Quản trị tệp `/data/asset` |

---

## 3. Các bước khởi chạy trên Docker

### Bước 1: Khởi động toàn bộ stack
Tại thư mục `extracted_source`:
```bash
docker-compose -f docker-compose.genex.yml up -d
```

### Bước 2: Khởi tạo dữ liệu cơ bản (Seed Database)
Khi container đã chạy, thực hiện chạy seed dữ liệu danh mục địa điểm, tài khoản admin mặc định:
```bash
docker exec -it genex-ads-app npm run loopback
# Hoặc chạy script seed:
docker exec -it genex-ads-app node dist/server/tasks/init-db.js
```

### Bước 3: Tạo chỉ mục Elasticsearch
```bash
docker exec -it genex-ads-app bash dist/server/tasks/migate-to-ads2/init-es.sh
```

---

## 4. Tích hợp thiết bị Gateway / AP (Ruijie, MikroTik, UniFi)

- **Ruijie / Reyee AP:**
  - Mode: `External Portal`
  - Portal Server URL: `http://<IP_MÁY_CHỦ>:9080/api/common/<ID_LOCATION>/externalType/chillispot`
  - Portal IP: `<IP_MÁY_CHỦ>` (Nhập IP LAN thực của server chạy Docker, ví dụ `192.168.1.200`)
  - Portal Port: `9080`

- **MikroTik:**
  - Cấu hình Hotspot Login URL trỏ về:
    `http://<IP_MÁY_CHỦ>:9080/api/common/<ID_LOCATION>/externalType/mikrotik/?ap=$mac&mac=$(mac)&client_ip=$(ip)&userurl=$(link-orig)&login_url=$(link-login-only)`
