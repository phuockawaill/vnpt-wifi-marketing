# -*- coding: utf-8 -*-
"""
Script to comprehensively test every specific feature of the VNPT Đắk Lắk WiFi Marketing Platform
Hits the live cloud API and validates HTTP response codes, payloads, logic, and edge cases.
"""

import urllib.request
import json
import ssl
import time

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE_BACKEND = "https://vnpt-wifi-backend.onrender.com"
BASE_PORTAL = "https://vnpt-wifi-portal.onrender.com"

test_results = []
cached_data = {}

def run_test(test_id, subsystem, name, method, url, payload=None, expected_status=200, validator=None):
    start = time.time()
    headers = {
        'User-Agent': 'VNPT-Automated-QA-Tester/1.0',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    status = 0
    body = ""
    error = None
    passed = False
    
    expected_statuses = expected_status if isinstance(expected_status, list) else [expected_status]
    
    try:
        data = json.dumps(payload).encode('utf-8') if payload else None
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=20, context=ctx) as res:
            status = res.status
            body = res.read().decode('utf-8')
            
        if status in expected_statuses:
            if validator:
                passed, error = validator(body)
            else:
                passed = True
        else:
            error = f"Expected status {expected_statuses}, got {status}"
    except urllib.error.HTTPError as e:
        status = e.code
        body = e.read().decode('utf-8', errors='ignore')
        if status in expected_statuses:
            if validator:
                passed, error = validator(body)
            else:
                passed = True
        else:
            error = f"HTTP Error {status}: {body[:200]}"
    except Exception as e:
        error = str(e)
        
    duration = round((time.time() - start) * 1000, 2)
    
    result = {
        'id': test_id,
        'subsystem': subsystem,
        'name': name,
        'method': method,
        'url': url,
        'status': status,
        'duration_ms': duration,
        'passed': passed,
        'error': error,
        'sample_response': (body[:120] + '...') if len(body) > 120 else body
    }
    test_results.append(result)
    
    mark = "✓ PASS" if passed else "✗ FAIL"
    print(f"[{mark}] {test_id} | {subsystem:24} - {name} ({duration}ms)")
    if not passed:
        print(f"    --> Error: {error}")
        
    return result

def main():
    print("=" * 85)
    print("TIẾN HÀNH KIỂM THỬ VÀ TEST TỪNG CHỨC NĂNG HỆ THỐNG WIFI MARKETING")
    print(f"Backend Target: {BASE_BACKEND}")
    print(f"Portal Target:  {BASE_PORTAL}")
    print("=" * 85)

    # -------------------------------------------------------------
    # 1. PHÂN HỆ CỔNG CHÀO & CAPTIVE PORTAL (CP-01 -> CP-08)
    # -------------------------------------------------------------
    run_test('CP-01', 'Cổng Chào & Captive Portal', 'Mở trang chào Captive Portal Client (/login)', 'GET', 
             f"{BASE_PORTAL}/login?venue=vnpt-daklak", 
             validator=lambda b: (True, None) if 'html' in b.lower() else (False, 'Không phải HTML'))

    run_test('CP-02', 'Cổng Chào & Captive Portal', 'Tiếp nhận tham số Router Ruijie Reyee (gw_address, mac, ip)', 'GET', 
             f"{BASE_PORTAL}/login?gw_id=1&gw_address=192.168.1.1&gw_port=2060&mac=66:76:D4:F8:8D:F1&ip=192.168.1.17", 
             validator=lambda b: (True, None) if 'html' in b.lower() else (False, 'Lỗi tham số'))

    def val_portal_init(body):
        try:
            d = json.loads(body)
            if 'venue' in d and 'campaign' in d:
                return True, None
            return False, "Thiếu key venue hoặc campaign trong response"
        except Exception as e:
            return False, f"JSON parse error: {e}"

    run_test('CP-03', 'Cổng Chào & Captive Portal', 'Khởi tạo phiên Portal Init từ Backend (/v1/portal/init)', 'GET', 
             f"{BASE_BACKEND}/v1/portal/init?venue=vnpt-daklak&mac=66:76:D4:F8:8D:F1&ip=192.168.1.17", 
             validator=val_portal_init)

    def val_auth(body):
        try:
            d = json.loads(body)
            if 'redirectUrl' in d or 'expiresAt' in d:
                return True, None
            return False, "Response authorize không hợp lệ"
        except Exception as e:
            return False, str(e)

    run_test('CP-04', 'Cổng Chào & Captive Portal', 'Gửi thông tin định danh & Cấp quyền Internet (Authorize)', 'POST',
             f"{BASE_BACKEND}/v1/portal/authorize",
             payload={
                 'venueId': 'vnpt-daklak',
                 'clientMac': '66:76:D4:F8:8D:F1',
                 'clientIp': '192.168.1.17',
                 'leadData': {'fullName': 'Lê Văn Test', 'phone': '0912345678', 'gender': 'male'},
                 'surveyData': {'ratingScore': 5, 'answer': 'Rất hài lòng với VNPT Đắk Lắk'}
             },
             expected_status=[200, 201],
             validator=val_auth)

    run_test('CP-05', 'Cổng Chào & Captive Portal', 'Ghi nhận sự kiện hiển thị Banner (Impression Tracking)', 'POST',
             f"{BASE_BACKEND}/v1/portal/track",
             payload={
                 'campaignId': 'demo-campaign',
                 'clientMac': '66:76:D4:F8:8D:F1',
                 'eventType': 'IMPRESSION',
                 'metadata': {'userAgent': 'Mobile Safari', 'screen': '390x844'}
             },
             expected_status=[200, 201],
             validator=lambda b: (True, None) if json.loads(b).get('success') is True else (False, 'Track failed'))

    run_test('CP-06', 'Cổng Chào & Captive Portal', 'Ghi nhận sự kiện tương tác Click Banner', 'POST',
             f"{BASE_BACKEND}/v1/portal/track",
             payload={
                 'campaignId': 'demo-campaign',
                 'clientMac': '66:76:D4:F8:8D:F1',
                 'eventType': 'CLICK',
                 'metadata': {'button': 'Connect'}
             },
             expected_status=[200, 201],
             validator=lambda b: (True, None) if json.loads(b).get('success') is True else (False, 'Track click failed'))

    run_test('CP-07', 'Cổng Chào & Captive Portal', 'Trang thông báo truy cập thành công (/portal)', 'GET',
             f"{BASE_PORTAL}/portal",
             validator=lambda b: (True, None) if 'html' in b.lower() else (False, 'Lỗi trang portal'))

    run_test('CP-08', 'Cổng Chào & Captive Portal', 'Tương thích Genex LoopBack - Endpoint Ping Router (/captiveRuijie/ping)', 'GET',
             f"{BASE_BACKEND}/api/common/vnpt-daklak/captiveRuijie/ping",
             validator=lambda b: (True, None) if 'Pong' in b else (False, 'Không trả về Pong'))

    # -------------------------------------------------------------
    # 2. PHÂN HỆ QUẢN LÝ CHIẾN DỊCH TIẾP THỊ (CM-01 -> CM-02)
    # -------------------------------------------------------------
    def val_campaigns(body):
        try:
            d = json.loads(body)
            if isinstance(d, list) and len(d) > 0:
                cached_data['first_campaign_id'] = d[0]['id']
                return True, None
            return False, "Không có chiến dịch nào"
        except Exception as e:
            return False, str(e)

    run_test('CM-01', 'Chiến Dịch Tiếp Thị', 'Truy vấn danh sách chiến dịch tiếp thị số (/v1/campaigns)', 'GET',
             f"{BASE_BACKEND}/v1/campaigns",
             validator=val_campaigns)

    first_camp_id = cached_data.get('first_campaign_id', '9b01cb2b-bcbf-4f65-91b7-594a8a0c6e0d')
    run_test('CM-02', 'Chiến Dịch Tiếp Thị', f'Truy vấn chi tiết cấu hình chiến dịch cụ thể ({first_camp_id[:8]}...)', 'GET',
             f"{BASE_BACKEND}/v1/campaigns/{first_camp_id}",
             validator=lambda b: (True, None) if 'id' in json.loads(b) else (False, 'Không tìm thấy chiến dịch'))

    # -------------------------------------------------------------
    # 3. PHÂN HỆ TÍCH HỢP GATEWAY & AP RUIJIE (GW-01 -> GW-05)
    # -------------------------------------------------------------
    run_test('GW-01', 'Gateway Ruijie & Thiết Bị', 'Tổng quan giải pháp tích hợp Ruijie Reyee Cloud', 'GET',
             f"{BASE_BACKEND}/v1/ruijie/overview",
             validator=lambda b: (True, None) if 'title' in json.loads(b) else (False, 'Thiếu title overview'))

    run_test('GW-02', 'Gateway Ruijie & Thiết Bị', 'Tài liệu hướng dẫn cấu hình Ruijie Reyee Cloud', 'GET',
             f"{BASE_BACKEND}/v1/ruijie/config-guide",
             validator=lambda b: (True, None) if 'steps' in json.loads(b) else (False, 'Thiếu steps hướng dẫn'))

    run_test('GW-03', 'Gateway Ruijie & Thiết Bị', 'Sinh đường dẫn Portal URL chuẩn Ruijie Cloud', 'GET',
             f"{BASE_BACKEND}/v1/ruijie/portal-url?venueSlug=vnpt-daklak&clientMac=66:76:D4:F8:8D:F1&clientIp=192.168.1.17",
             validator=lambda b: (True, None) if 'portalUrl' in json.loads(b) else (False, 'Thiếu portalUrl'))

    run_test('GW-04', 'Gateway Ruijie & Thiết Bị', 'Kiểm tra kết nối Gateway Ruijie Reyee Cloud (Ping Test)', 'POST',
             f"{BASE_BACKEND}/v1/ruijie/test-connection",
             payload={'gatewayIp': '192.168.1.1', 'port': 2060, 'useCloudMacc': False},
             expected_status=[200, 201],
             validator=lambda b: (True, None) if 'results' in json.loads(b) else (False, 'Lỗi test connection'))

    run_test('GW-05', 'Gateway Ruijie & Thiết Bị', 'Lệnh cấp quyền mở mạng Cloud Portal Auth (/authorize)', 'POST',
             f"{BASE_BACKEND}/v1/ruijie/authorize",
             payload={
                 'clientMac': '66:76:D4:F8:8D:F1',
                 'clientIp': '192.168.1.17',
                 'durationMinutes': 180,
                 'method': 'LOCAL_WEBAUTH'
             },
             expected_status=[200, 201],
             validator=lambda b: (True, None) if json.loads(b).get('success') is True else (False, 'Lệnh authorize thất bại'))

    # -------------------------------------------------------------
    # 4. PHÂN HỆ KHÁCH HÀNG & CRM (CRM-01 -> CRM-04)
    # -------------------------------------------------------------
    run_test('CRM-01', 'Khách Hàng & CRM', 'Truy vấn danh bạ khách hàng định danh (/v1/crm/leads)', 'GET',
             f"{BASE_BACKEND}/v1/crm/leads",
             validator=lambda b: (True, None) if 'items' in json.loads(b) else (False, 'Thiếu items danh sách leads'))

    run_test('CRM-02', 'Khách Hàng & CRM', 'Bộ lọc tìm kiếm khách hàng theo Tên / Số điện thoại', 'GET',
             f"{BASE_BACKEND}/v1/crm/leads?search=H%C3%B9ng",
             validator=lambda b: (True, None) if len(json.loads(b).get('items', [])) > 0 else (False, 'Không tìm thấy dữ liệu lọc'))

    run_test('CRM-03', 'Khách Hàng & CRM', 'Thống kê tổng hợp khách hàng và phân bố giới tính (/v1/crm/stats)', 'GET',
             f"{BASE_BACKEND}/v1/crm/stats",
             validator=lambda b: (True, None) if 'totalGuests' in json.loads(b) or 'totalVisits' in json.loads(b) else (False, 'Thiếu stats CRM'))

    run_test('CRM-04', 'Khách Hàng & CRM', 'Tích hợp gửi tin nhắn chăm sóc SMS Brandname / Zalo ZNS', 'POST',
             f"{BASE_BACKEND}/v1/crm/send-notification",
             payload={'guestId': 'mock-01', 'channel': 'SMS', 'message': 'VNPT Đắk Lắk kính chúc quý khách ngày mới tốt lành!'},
             expected_status=[200, 201],
             validator=lambda b: (True, None) if json.loads(b).get('success') is True else (False, 'Gửi tin nhắn thất bại'))

    # -------------------------------------------------------------
    # 5. PHÂN HỆ QUẢN LÝ VOUCHERS & BĂNG THÔNG (VC-01 -> VC-03)
    # -------------------------------------------------------------
    run_test('VC-01', 'Quản Lý Vouchers & QoS', 'Truy vấn danh sách mã voucher phát hành (/v1/vouchers)', 'GET',
             f"{BASE_BACKEND}/v1/vouchers",
             validator=lambda b: (True, None) if isinstance(json.loads(b), list) else (False, 'Danh sách voucher không phải list'))

    run_test('VC-02', 'Quản Lý Vouchers & QoS', 'Sinh mã Voucher điện tử mới với thời lượng & tốc độ (/create)', 'POST',
             f"{BASE_BACKEND}/v1/vouchers/create",
             payload={'code': f'TEST_VC_{int(time.time())}', 'minutes': 180, 'speedMbps': 50, 'maxUses': 10},
             expected_status=[200, 201],
             validator=lambda b: (True, None) if 'code' in json.loads(b) else (False, 'Không sinh được voucher'))

    run_test('VC-03', 'Quản Lý Vouchers & QoS', 'Khai báo và kích hoạt mã Voucher từ thiết bị khách hàng (/claim)', 'POST',
             f"{BASE_BACKEND}/v1/vouchers/claim",
             payload={'code': 'VNPT_BMT_2026', 'clientMac': '66:76:D4:F8:8D:F1'},
             expected_status=[200, 201],
             validator=lambda b: (True, None) if json.loads(b).get('valid') is True else (False, 'Voucher claim không hợp lệ'))

    # -------------------------------------------------------------
    # 6. PHÂN HỆ QUẢN LÝ ĐỊA ĐIỂM (VN-01 -> VN-02)
    # -------------------------------------------------------------
    def val_venues(body):
        try:
            d = json.loads(body)
            if isinstance(d, list) and len(d) > 0:
                cached_data['first_venue_id'] = d[0]['id']
                return True, None
            return False, "Không có địa điểm nào"
        except Exception as e:
            return False, str(e)

    run_test('VN-01', 'Quản Lý Địa Điểm', 'Danh sách địa điểm & Điểm phát sóng VNPT Đắk Lắk (/v1/venues)', 'GET',
             f"{BASE_BACKEND}/v1/venues",
             validator=val_venues)

    first_ven_id = cached_data.get('first_venue_id', '9b84fedf-64b0-4fbf-a7e6-b3349486244c')
    run_test('VN-02', 'Quản Lý Địa Điểm', f'Truy vấn thông tin chi tiết một địa điểm cụ thể ({first_ven_id[:8]}...)', 'GET',
             f"{BASE_BACKEND}/v1/venues/{first_ven_id}",
             validator=lambda b: (True, None) if 'id' in json.loads(b) else (False, 'Không tìm thấy địa điểm'))

    # -------------------------------------------------------------
    # 7. PHÂN HỆ BÁO CÁO & QUẢN TRỊ HỢP NHẤT (BI-01, SYS-01, SYS-02)
    # -------------------------------------------------------------
    run_test('BI-01', 'Báo Cáo & Phân Tích BI', 'Thống kê tổng quan KPI thời gian thực (Overview)', 'GET',
             f"{BASE_BACKEND}/v1/analytics/overview",
             validator=lambda b: (True, None) if 'totalVisits' in json.loads(b) else (False, 'Thiếu KPI analytics'))

    run_test('SYS-01', 'Quản Trị Hợp Nhất', 'Truy cập Trung Tâm Quản Trị Hợp Nhất All-in-One (/admin)', 'GET',
             f"{BASE_PORTAL}/admin",
             validator=lambda b: (True, None) if 'html' in b.lower() else (False, 'Lỗi load trang admin'))

    run_test('SYS-02', 'Tài Liệu Kỹ Thuật & API', 'Tài liệu OpenAPI Swagger UI Interactive (/docs)', 'GET',
             f"{BASE_BACKEND}/docs",
             validator=lambda b: (True, None) if 'swagger' in b.lower() or 'html' in b.lower() else (False, 'Swagger chưa bật'))

    # Tổng kết
    total = len(test_results)
    passed_count = sum(1 for r in test_results if r['passed'])
    failed_count = total - passed_count
    
    print("\n" + "=" * 85)
    print(f"KẾT QUẢ KIỂM THỬ TẤT CẢ CHỨC NĂNG: {passed_count}/{total} ĐẠT (Tỷ lệ: {round(passed_count/total*100, 1)}%)")
    print("=" * 85)
    
    with open('test_execution_report.json', 'w', encoding='utf-8') as f:
        json.dump({
            'execution_time': time.strftime('%Y-%m-%d %H:%M:%S'),
            'total_tests': total,
            'passed': passed_count,
            'failed': failed_count,
            'pass_rate': f"{round(passed_count/total*100, 1)}%",
            'details': test_results
        }, f, ensure_ascii=False, indent=2)
        
    print("[OK] Đã xuất báo cáo chi tiết: test_execution_report.json")

if __name__ == '__main__':
    main()
