# Hướng Dẫn Cấu Hình Thiết Bị Mạng Cho Hệ Thống WiFi Marketing

Tài liệu hướng dẫn kỹ thuật viên kết nối các dòng Router / Access Point phổ biến (**MikroTik RouterOS**, **Ubiquiti UniFi**, **Ruijie Reyee**) vào hệ thống Captive Portal.

---

## 1. MikroTik RouterOS (RouterOS v6 & v7)

### 1.1. Chuẩn Bị & Bật Hotspot
1. Kết nối vào Winbox, vào **IP > Hotspot**.
2. Bấm **Hotspot Setup** và chọn Interface phát WiFi (ví dụ: `bridge-guest` hoặc `wlan1`).
3. Đặt dải IP cấp cho khách (VD: `192.168.88.0/24`).

### 1.2. Cấu Hình Walled Garden (Whitelist tên miền)
Khách hàng trước khi đăng nhập cần được phép tải trang portal, CSS, CDN và ảnh/video:
```routeros
/ip hotspot walled-garden
add dst-host=portal.yourdomain.com
add dst-host=*.unsplash.com
add dst-host=*.cloudflare.com
add dst-host=*.google.com
add dst-host=*.facebook.com
add dst-host=*.zalo.me
```

### 1.3. Cấu hình chuyển hướng sang External Portal
Sửa file `login.html` trong thư mục `hotspot` của MikroTik bằng Winbox (hoặc FTP):
```html
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0; url=https://portal.yourdomain.com?mac=$(mac)&ip=$(ip)&username=$(username)&link-login=$(link-login)&link-orig=$(link-orig)">
    <meta http-equiv="pragma" content="no-cache">
    <meta http-equiv="expires" content="-1">
</head>
<body>
    <p>Đang chuyển hướng tới cổng đăng nhập WiFi Marketing...</p>
</body>
</html>
```

### 1.4. Mở REST API (Trên RouterOS v7)
```routeros
/ip service set rest port=80 disabled=no
/user add name=wifimarketing group=full password="YourStrongPassword123"
```

---

## 2. Ubiquiti UniFi Controller

### 2.1. Cấu hình External Portal
1. Truy cập giao diện quản trị UniFi Controller (hoặc UniFi OS).
2. Vào **Settings > Wireless Networks > [Chọn SSID Khách]**:
   - Security: **Open**
   - Guest Policy: **Bật Checkbox (Apply guest policies)**.
3. Vào **Settings > Guest Control**:
   - Guest Portal: **Enable Guest Portal**.
   - Authentication: Chọn **External Portal Server**.
   - IP Address / Hostname: Nhập địa chỉ máy chủ Portal (VD: `portal.yourdomain.com`).
   - Use Secure Portal: **Bật HTTPS (Port 443)** nếu server có chứng chỉ SSL.
4. Cấu hình **Pre-Authorization Access** (Walled Garden):
   - Nhập IP / Subnet của máy chủ Backend & Portal.
   - Nhập các domain CDN hình ảnh quảng cáo.

### 2.2. Tạo tài khoản API trên UniFi Controller
- Tạo Admin phụ với quyền quản trị Site (Site Admin).
- Khai báo thông tin `username`, `password`, `controllerUrl`, `siteId` vào mục **Device** trên Dashboard WiFi Marketing.

---

## 3. Ruijie Reyee (Ruijie Cloud / Reyee Router Gateway / EAP)

### 3.1. Hướng Dẫn Điền Thông Số Giao Diện External Portal (Chi Tiết Từng Ô)
Khi cấu hình SSID trên Ruijie Reyee Cloud hoặc Web GUI của Gateway (RG-EG series / RG-RAP series):
- **Encryption Mode**: Chọn `Open` (Mạng không đặt mật khẩu WPA để khách dễ kết nối).
- **VLAN ID**: `1` (hoặc VLAN Guest riêng biệt).
- **Radio**: Tích chọn cả `Radio1(2.4GHz)` và `Radio2(5GHz)`.
- **Wi-Fi 6**: Bật `ON` (nếu AP hỗ trợ Wi-Fi 6).
- **Auth**: Bật `ON` (Bắt buộc xác thực).
- **Mode**: Chọn **`External Portal`**.

#### Bảng cấu hình chi tiết:
| Trường thông tin | Giá trị điền (Môi trường Test) | Giá trị điền (Production VNPT Đắk Lắk) | Ý nghĩa kỹ thuật |
| :--- | :--- | :--- | :--- |
| **Portal Server URL** | `http://<IP_MÁY_CHỦ>:3000` | `https://portal.daklak.vnpt.vn?venue=vnpt-daklak` | Địa chỉ trang chào mà Ruijie sẽ redirect người dùng tới. Ruijie sẽ tự động gán thêm các tham số `client_mac`, `client_ip`, `gw_address`, `gw_port`. |
| **Portal IP** | `<IP_MÁY_CHỦ_LAN>` (VD: `192.168.1.100`) | `<IP_PUBLIC_SERVER>` (VD: IP WAN VNPT Cloud) | Địa chỉ IP của máy chủ chứa Portal. Ruijie sẽ tự động đưa IP này vào danh sách Whitelist cho phép truy cập trước khi đăng nhập. |
| **Portal Port(Optional)** | `3000` | `443` (hoặc để trống nếu dùng HTTPS chuẩn) | Cổng mạng của dịch vụ Portal. |
| **Gateway ID(Optional)** | `vnpt-daklak-gw-01` | `vnpt-daklak-gw-01` | Mã định danh Gateway Ruijie (chuẩn WiFiDog), hệ thống tự map về đúng địa điểm. |
| **Seamless Online** | `[x] Enable` | `[x] Enable` | **Đăng nhập liền mạch (MAC Re-auth)**: Khách đã xác thực trong ngày/tuần không phải đăng nhập lại khi quay lại. |
| **Idle Client Timeout**| `[x] Enable` | `[x] Enable` | Tự động ngắt kết nối client không hoạt động để tiết kiệm tài nguyên router. |

### 3.2. Cấu hình Walled Garden (Whitelist Domain) trên Ruijie
Trên Ruijie Cloud / Reyee Gateway, vào mục **Walled Garden / Whitelist** và thêm:
- `portal.daklak.vnpt.vn` (Tên miền Portal)
- `admin.daklak.vnpt.vn` (Tên miền API / CMS)
- `images.unsplash.com` (CDN chứa hình ảnh banner Buôn Ma Thuột)
- `daklak.vnpt.vn` (Trang đích chuyển hướng sau khi hoàn tất)

---

## 4. Kiểm Thử Hệ Thống Với Chế Độ Giả Lập (Mock Gateway Mode)

Nếu bạn đang phát triển trên máy tính và chưa kết nối thiết bị mạng thật:
1. Trong file `.env` của Backend:
   ```env
   MOCK_GATEWAY_ENABLED=true
   ```
2. Mở trình duyệt và truy cập trang chào với các tham số mẫu:
   ```
   http://localhost:3000?venue=highlands-coffee&mac=AA:BB:CC:11:22:33&ip=192.168.88.254
   ```
3. Sau khi bấm kết nối, Backend sẽ ghi nhận thiết bị MAC vào bộ nhớ RAM và cấp quyền giả lập, sau đó chuyển hướng tới trang thành công.
