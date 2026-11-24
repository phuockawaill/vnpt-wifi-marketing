# -*- coding: utf-8 -*-
"""
Script to generate a comprehensive, enterprise-grade Word (.docx) document:
"BẢNG ĐẶC TẢ DANH SÁCH CHỨC NĂNG PHẦN MỀM WIFI MARKETING"
VNPT Đắk Lắk AI / Multi-Vendor Smart WiFi Marketing Platform
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    """Set background color of a table cell."""
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tc_pr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Set inner padding of a table cell (in twips: 20 twips = 1 pt)."""
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_mar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tc_pr.append(tc_mar)

def set_table_borders(table, color="CBD5E1", sz="4", val="single"):
    """Apply elegant borders to table."""
    tbl_pr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="none"/>'
        f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:right w:val="none"/>'
        f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tbl_pr.append(borders)

def make_callout_box(doc, text, title="LƯU Ý / GHI CHÚ", border_color="005BAC", bg_color="F0F7FF"):
    """Creates a callout info box."""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.rows[0].cells[0]
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=160, bottom=160, left=240, right=200)
    
    # Left border only
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:left w:val="single" w:sz="24" w:color="{border_color}"/>'
        f'<w:top w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'<w:bottom w:val="none"/>'
        f'</w:tcBorders>'
    )
    tc_pr.append(tc_borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    run_t = p.add_run(f"📌 {title}: ")
    run_t.bold = True
    run_t.font.color.rgb = RGBColor(0, 91, 172)
    run_t.font.size = Pt(10)
    
    run_c = p.add_run(text)
    run_c.font.size = Pt(10)
    run_c.font.color.rgb = RGBColor(30, 41, 59)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def format_table_header(row, col_names, col_widths, bg_hex="005BAC"):
    """Format table header row with VNPT blue and bold white text."""
    for idx, name in enumerate(col_names):
        cell = row.cells[idx]
        cell.text = name
        cell.width = col_widths[idx]
        set_cell_background(cell, bg_hex)
        set_cell_margins(cell, top=140, bottom=140, left=140, right=140)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        for r in p.runs:
            r.bold = True
            r.font.name = "Calibri"
            r.font.size = Pt(9.5)
            r.font.color.rgb = RGBColor(255, 255, 255)

def add_table_data_row(table, data, col_widths, is_even=False, alignments=None):
    """Add a data row to a table with alternating shading."""
    row = table.add_row()
    bg_hex = "F8FAFC" if is_even else "FFFFFF"
    
    for idx, val in enumerate(data):
        cell = row.cells[idx]
        cell.text = str(val)
        cell.width = col_widths[idx]
        set_cell_background(cell, bg_hex)
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.15
        
        align = WD_ALIGN_PARAGRAPH.LEFT
        if alignments and idx < len(alignments):
            align = alignments[idx]
        p.alignment = align
        
        for r in p.runs:
            r.font.name = "Calibri"
            r.font.size = Pt(9.5)
            r.font.color.rgb = RGBColor(30, 41, 59)
            if idx == 0 or idx == 1: # STT or Code
                r.bold = True
                if idx == 1:
                    r.font.color.rgb = RGBColor(0, 91, 172)
    return row

def generate_doc(output_path):
    doc = docx.Document()
    
    # Page setup - A4 with 0.8 inch margins
    sections = doc.sections
    for section in sections:
        section.page_width = Inches(8.27)
        section.page_height = Inches(11.69)
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
    # Styles
    VNPT_BLUE = RGBColor(0, 91, 172)     # #005BAC
    VNPT_CYAN = RGBColor(0, 163, 224)    # #00A3E0
    TEXT_DARK = RGBColor(30, 41, 59)     # Slate 800
    MUTED_GRAY = RGBColor(100, 116, 139) # Slate 500

    # =========================================================================
    # HEADER / BANNER SECTION
    # =========================================================================
    p_org = doc.add_paragraph()
    p_org.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_org.paragraph_format.space_before = Pt(0)
    p_org.paragraph_format.space_after = Pt(2)
    r_org = p_org.add_run("TẬP ĐOÀN BƯU CHÍNH VIỄN THÔNG VIỆT NAM\nVIỄN THÔNG ĐẮK LẮK (VNPT ĐẮK LẮK)")
    r_org.bold = True
    r_org.font.name = "Calibri"
    r_org.font.size = Pt(11)
    r_org.font.color.rgb = VNPT_BLUE
    
    p_divider = doc.add_paragraph()
    p_divider.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_divider.paragraph_format.space_after = Pt(16)
    r_div = p_divider.add_run("─────────── ★ ───────────")
    r_div.font.color.rgb = VNPT_CYAN
    r_div.font.size = Pt(10)

    # Document Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(6)
    r_title = p_title.add_run("BẢNG ĐẶC TẢ DANH SÁCH CHỨC NĂNG\nPHẦN MỀM WIFI MARKETING THÔNG MINH")
    r_title.bold = True
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(18)
    r_title.font.color.rgb = VNPT_BLUE

    # Subtitle
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(20)
    r_sub = p_sub.add_run("Hệ Thống WiFi Marketing Đa Điểm Phát & Tích Hợp Đa Thiết Bị Gateway\n(Phục Vụ Chuyển Đổi Số, Đô Thị Thông Minh IOC & Doanh Nghiệp Tỉnh Đắk Lắk)")
    r_sub.italic = True
    r_sub.font.size = Pt(11)
    r_sub.font.color.rgb = MUTED_GRAY

    # Document Meta Box
    meta_table = doc.add_table(rows=4, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_widths = [Inches(2.2), Inches(4.3)]
    set_table_borders(meta_table, color="00A3E0", sz="6")
    
    meta_data = [
        ("Tên dự án / Nền tảng:", "VNPT Đắk Lắk Smart WiFi Marketing AI Platform"),
        ("Phiên bản tài liệu:", "v1.0.0 (Release 2026 - Production Ready)"),
        ("Đơn vị xây dựng & chủ trì:", "Trung tâm Điều hành Đô thị Thông minh (IOC) - VNPT Đắk Lắk"),
        ("Đối tượng áp dụng:", "Hành chính công, Trung tâm IOC, Doanh nghiệp F&B, Khách sạn, Bệnh viện, Sự kiện")
    ]
    for row_idx, (k, v) in enumerate(meta_data):
        row = meta_table.rows[row_idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.text, c1.text = k, v
        c0.width, c1.width = meta_widths[0], meta_widths[1]
        set_cell_background(c0, "F0F7FF")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, top=80, bottom=80, left=120, right=120)
        set_cell_margins(c1, top=80, bottom=80, left=120, right=120)
        p0, p1 = c0.paragraphs[0], c1.paragraphs[0]
        p0.runs[0].bold = True
        p0.runs[0].font.size = Pt(9.5)
        p0.runs[0].font.color.rgb = VNPT_BLUE
        p1.runs[0].font.size = Pt(9.5)
        p1.runs[0].font.color.rgb = TEXT_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # =========================================================================
    # PHẦN 1: GIỚI THIỆU TỔNG QUAN
    # =========================================================================
    h1 = doc.add_heading("1. TỔNG QUAN HỆ THỐNG PHẦN MỀM", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)
    for r in h1.runs:
        r.font.color.rgb = VNPT_BLUE
        r.bold = True
        r.font.size = Pt(13)

    p_intro = doc.add_paragraph(
        "Hệ thống phần mềm WiFi Marketing thông minh của VNPT Đắk Lắk là giải pháp chuyển đổi số toàn diện, "
        "kết hợp hạ tầng viễn thông internet băng rộng và công nghệ quảng bá tương tác số đa kênh. "
        "Hệ thống hỗ trợ quản lý tập trung đa điểm phát (Multi-Venue), tích hợp đa dòng phần cứng (Ruijie Reyee, "
        "Modem GPON iGate VNPT, MikroTik, Cisco, UniFi), kiểm soát băng thông QoS và thu thập dữ liệu khách hàng (CDP/Leads) "
        "tuân thủ nghiêm ngặt các tiêu chuẩn an toàn bảo mật dữ liệu người dùng."
    )
    p_intro.paragraph_format.line_spacing = 1.25
    p_intro.paragraph_format.space_after = Pt(8)

    make_callout_box(
        doc,
        "Hệ thống được thiết kế theo kiến trúc Microservices & Cloud-Native, sẵn sàng mở rộng quy mô lớn (High Availability), "
        "hỗ trợ cơ chế Resilient Offline (tự phục vụ trang chào ngay cả khi mạng backend suy hao) và tích hợp API Gateway đa vendor.",
        title="ĐIỂM NỔI BẬT VỀ KIẾN TRÚC"
    )

    # =========================================================================
    # PHẦN 2: BẢNG TỔNG HỢP CÁC PHÂN HỆ CHÍNH
    # =========================================================================
    h2 = doc.add_heading("2. DANH MỤC CÁC PHÂN HỆ HỆ THỐNG (SYSTEM MODULES)", level=1)
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(6)
    for r in h2.runs:
        r.font.color.rgb = VNPT_BLUE
        r.bold = True
        r.font.size = Pt(13)

    summary_headers = ["STT", "Mã Phân Hệ", "Tên Phân Hệ Chức Năng", "Số Lượng Chức Năng", "Vai Trò & Phạm Vi Đáp Ứng"]
    summary_widths = [Inches(0.6), Inches(1.1), Inches(2.2), Inches(1.0), Inches(1.6)]
    summary_table = doc.add_table(rows=1, cols=len(summary_headers))
    summary_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(summary_table)
    format_table_header(summary_table.rows[0], summary_headers, summary_widths)

    subsystems_summary = [
        (1, "MOD-PORTAL", "Cổng Chào & Tương Tác Người Dùng (Captive Portal)", 8, "Trang chào xác thực thiết bị, hiển thị banner, lead form, khảo sát và cấp Internet."),
        (2, "MOD-CAMP", "Quản Lý Chiến Dịch & Phân Lịch (Campaign Engine)", 7, "Tạo lập, kích hoạt ưu tiên, phân lịch phát sóng và chính sách giới hạn băng thông QoS."),
        (3, "MOD-GW", "Tích Hợp Cổng Mạng Đa Thiết Bị (Multi-Vendor Gateway)", 6, "Kết nối Router Ruijie Reyee Cloud, GPON VNPT iGate, MikroTik, UniFi, Cisco."),
        (4, "MOD-VENUE", "Quản Trị Đa Địa Điểm & Khách Hàng (Multi-Venue / Tenant)", 5, "Quản lý điểm phát sóng, cấu hình nhận diện thương hiệu, logo, phân quyền cơ sở."),
        (5, "MOD-CDP", "Thu Thập & Khai Thác Dữ Liệu Khách Hàng (Leads & CDP)", 6, "Quản lý danh sách khách hàng tiềm năng, lịch sử truy cập, phân loại tệp khách hàng."),
        (6, "MOD-BI", "Phân Tích Dữ Liệu & Báo Cáo Thông Minh (AI Analytics & BI)", 5, "Dashboard theo dõi lượt hiển thị, click, footfall traffic, khảo sát CSAT và xuất Excel/PDF."),
        (7, "MOD-SYS", "Quản Trị Hệ Thống, Bảo Mật & API (System & Security)", 6, "Phân quyền người dùng đa cấp, nhật ký kiểm toán, bảo mật dữ liệu, RESTful API Gateway.")
    ]

    for idx, (stt, code, name, count, scope) in enumerate(subsystems_summary):
        add_table_data_row(
            summary_table,
            [stt, code, name, f"{count} chức năng", scope],
            summary_widths,
            is_even=(idx % 2 == 1),
            alignments=[WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT]
        )

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # =========================================================================
    # PHẦN 3: CHI TIẾT TỪNG PHÂN HỆ VÀ CHỨC NĂNG CỤ THỂ
    # =========================================================================
    h3 = doc.add_heading("3. ĐẶC TẢ CHI TIẾT DANH SÁCH CHỨC NĂNG THEO TỪNG PHÂN HỆ", level=1)
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(6)
    for r in h3.runs:
        r.font.color.rgb = VNPT_BLUE
        r.bold = True
        r.font.size = Pt(13)

    detail_headers = ["STT", "Mã Chức Năng", "Tên Chức Năng", "Mô Tả Chi Tiết Hoạt Động", "Mức Độ Ưu Tiên", "Đối Tượng"]
    detail_widths = [Inches(0.5), Inches(1.1), Inches(1.6), Inches(2.2), Inches(0.6), Inches(0.5)]

    # -------------------------------------------------------------------------
    # 3.1 PHÂN HỆ 1: CỔNG CHÀO CAPTIVE PORTAL
    # -------------------------------------------------------------------------
    h3_1 = doc.add_heading("3.1. Phân hệ 1: Cổng Chào & Trải Nghiệm Người Dùng (Captive Portal & UX)", level=2)
    for r in h3_1.runs:
        r.font.color.rgb = VNPT_BLUE
        r.font.size = Pt(11.5)
        r.bold = True

    t1 = doc.add_table(rows=1, cols=len(detail_headers))
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t1)
    format_table_header(t1.rows[0], detail_headers, detail_widths)

    mod1_features = [
        (1, "POR-01", "Tự động nhận diện thiết bị & thông số kết nối", 
         "Bắt các tham số gateway truyền qua URL (client_mac, client_ip, gw_id, ssid, vlan) để định danh thiết bị truy cập và phân luồng chính sách.", "Bắt buộc", "Người dùng / Router"),
        (2, "POR-02", "Kịch bản xem Banner & Đếm ngược thời gian", 
         "Hiển thị banner quảng cáo/thông điệp tuyên truyền chuyển đổi số, đếm ngược (3s - 10s) trước khi cho phép bấm nút truy cập Internet.", "Bắt buộc", "Người dùng"),
        (3, "POR-03", "Kịch bản Thu thập Form Thông tin (Lead Form)", 
         "Biểu mẫu thu thập thông tin khách hàng: Họ và tên, Số điện thoại di động, Giới tính, Độ tuổi. Kiểm tra tính hợp lệ của số điện thoại Việt Nam.", "Bắt buộc", "Người dùng"),
        (4, "POR-04", "Kịch bản Khảo sát trực tuyến (Online Survey)", 
         "Hiển thị câu hỏi thăm dò ý kiến hoặc đánh giá chất lượng dịch vụ (thang điểm 1 - 5 sao hoặc tùy chọn trắc nghiệm) trước khi cấp Internet.", "Tùy chọn", "Người dùng"),
        (5, "POR-05", "Xác thực Một chạm (One-Click Login)", 
         "Chế độ kết nối siêu tốc: Người dùng chỉ cần xem banner và bấm 'Kết nối Internet' mà không cần điền thông tin phức tạp.", "Bắt buộc", "Người dùng"),
        (6, "POR-06", "Thiết kế tương thích đa màn hình (Mobile-First UI)", 
         "Giao diện chuẩn Responsive, tối ưu hiển thị mượt mà trên 100% dòng điện thoại iPhone (iOS), Android, máy tính bảng và laptop.", "Bắt buộc", "Hệ thống"),
        (7, "POR-07", "Điều hướng trang đích sau kết nối (Landing Page Redirect)", 
         "Tự động mở trang web đích sau khi hoàn tất xác thực (Cổng thông tin tỉnh Đắk Lắk, Cổng IOC, Fanpage, Website doanh nghiệp).", "Bắt buộc", "Người dùng"),
        (8, "POR-08", "Cơ chế dự phòng sự cố mạng (Resilient Offline Mode)", 
         "Khi máy chủ backend hoặc cơ sở dữ liệu gặp sự cố/suy hao mạng, Portal tự kích hoạt trang chào dự phòng chuẩn VNPT để người dùng vẫn vào được mạng.", "Bắt buộc", "Hệ thống")
    ]
    for idx, (stt, code, name, desc, prio, role) in enumerate(mod1_features):
        add_table_data_row(t1, [stt, code, name, desc, prio, role], detail_widths, is_even=(idx%2==1),
                           alignments=[WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER])

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # -------------------------------------------------------------------------
    # 3.2 PHÂN HỆ 2: QUẢN LÝ CHIẾN DỊCH QUẢNG CÁO & KHẢO SÁT
    # -------------------------------------------------------------------------
    h3_2 = doc.add_heading("3.2. Phân hệ 2: Quản Lý Chiến Dịch Marketing & Khảo Sát Số (Campaign Management)", level=2)
    for r in h3_2.runs:
        r.font.color.rgb = VNPT_BLUE
        r.font.size = Pt(11.5)
        r.bold = True

    t2 = doc.add_table(rows=1, cols=len(detail_headers))
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t2)
    format_table_header(t2.rows[0], detail_headers, detail_widths)

    mod2_features = [
        (1, "CMP-01", "Tạo và cấu hình chiến dịch quảng bá", 
         "Thiết lập tên chiến dịch, tải lên hình ảnh banner, thiết lập thời gian đếm ngược, chọn loại hình (Banner, Lead Form, Survey).", "Bắt buộc", "Admin / Manager"),
        (2, "CMP-02", "Kích hoạt ưu tiên phát sóng chính (Priority Engine)", 
         "Tính năng 1-Click đưa chiến dịch lên mức ưu tiên cao nhất (Priority = 10) để hiển thị tức thì trên cổng chào, tự động hạ ưu tiên chiến dịch cũ.", "Bắt buộc", "Admin / Manager"),
        (3, "CMP-03", "Bật/Tắt trạng thái hoạt động tức thì", 
         "Chuyển đổi trạng thái hoạt động (HOẠT ĐỘNG / TẠM DỪNG) của từng chiến dịch theo thời gian thực mà không làm gián đoạn hệ thống.", "Bắt buộc", "Admin / Manager"),
        (4, "CMP-04", "Thiết lập chính sách băng thông QoS", 
         "Giới hạn tốc độ tải xuống (Download Speed, ví dụ 30 Mbps) và tải lên (Upload Speed, ví dụ 15 Mbps) cấp phát cho từng thiết bị kết nối.", "Quan trọng", "Admin / Vận hành"),
        (5, "CMP-05", "Quản lý thời lượng phiên truy cập (Session Timeout)", 
         "Quy định thời gian sử dụng WiFi miễn phí (ví dụ: 60 phút, 180 phút). Hết thời gian, người dùng cần xem lại quảng cáo để tiếp tục kết nối.", "Bắt buộc", "Admin / Vận hành"),
        (6, "CMP-06", "Phân lịch phát sóng tự động (Time Scheduling)", 
         "Lên lịch chạy chiến dịch theo khung giờ trong ngày (Giờ cao điểm trưa, tối), các ngày trong tuần hoặc khoảng thời gian diễn ra sự kiện/lễ hội.", "Quan trọng", "Admin / Manager"),
        (7, "CMP-07", "Điều phối chiến dịch theo từng địa điểm", 
         "Gắn chiến dịch riêng biệt cho từng điểm phát sóng (ví dụ: Chiến dịch giới thiệu cà phê tại Buôn Ma Thuột, chiến dịch dịch vụ công tại IOC).", "Bắt buộc", "Admin / Manager")
    ]
    for idx, (stt, code, name, desc, prio, role) in enumerate(mod2_features):
        add_table_data_row(t2, [stt, code, name, desc, prio, role], detail_widths, is_even=(idx%2==1),
                           alignments=[WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER])

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # -------------------------------------------------------------------------
    # 3.3 PHÂN HỆ 3: TÍCH HỢP ĐA THIẾT BỊ MẠNG & GATEWAY
    # -------------------------------------------------------------------------
    h3_3 = doc.add_heading("3.3. Phân hệ 3: Tích Hợp Đa Thiết Bị Mạng & Gateway (Multi-Vendor Integration)", level=2)
    for r in h3_3.runs:
        r.font.color.rgb = VNPT_BLUE
        r.font.size = Pt(11.5)
        r.bold = True

    t3 = doc.add_table(rows=1, cols=len(detail_headers))
    t3.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t3)
    format_table_header(t3.rows[0], detail_headers, detail_widths)

    mod3_features = [
        (1, "GW-01", "Tích hợp chuyên sâu Router Ruijie Reyee & Cloud", 
         "Hỗ trợ dòng Router RG-EG105G, RG-EG210G và Ruijie Cloud qua giao thức External Captive Portal URL, tự động phân giải MAC/IP và authorize client.", "Bắt buộc", "Router / Backend"),
        (2, "GW-02", "Tích hợp thiết bị viễn thông VNPT GPON iGate", 
         "Hỗ trợ tích hợp cổng chào trên các dòng Modem ONT GPON iGate của VNPT Technology và thiết bị VNPT Mesh Access Point.", "Bắt buộc", "Router / Backend"),
        (3, "GW-03", "Tích hợp Router MikroTik (RouterOS Hotspot API)", 
         "Tương thích giao thức MikroTik Hotspot Servlet (login?dst=...&username=...), hỗ trợ đồng bộ phiên qua API hoặc RADIUS.", "Quan trọng", "Router / Backend"),
        (4, "GW-04", "Tích hợp chuẩn Gateway doanh nghiệp (Cisco, UniFi, Aruba)", 
         "Hỗ trợ Cisco Meraki Splash Page, Ubiquiti UniFi External Portal, Aruba ClearPass theo tiêu chuẩn Captive Network Assistant (CNA).", "Mở rộng", "Router / Backend"),
        (5, "GW-05", "Kiểm tra kết nối thiết bị trực tiếp (Test Connection)", 
         "Tính năng 1-Click trên CMS để gửi lệnh kiểm tra tình trạng kết nối mạng tới từng Router/AP, hiển thị trạng thái Online/Offline.", "Quan trọng", "Kỹ thuật viên"),
        (6, "GW-06", "Bộ tài liệu hướng dẫn cấu hình thiết bị tự động", 
         "Hệ thống cung cấp sẵn bảng hướng dẫn từng bước cấu hình URL Portal, White-list Domain (Walled Garden) cho Router Ruijie và các hãng.", "Quan trọng", "Kỹ thuật viên")
    ]
    for idx, (stt, code, name, desc, prio, role) in enumerate(mod3_features):
        add_table_data_row(t3, [stt, code, name, desc, prio, role], detail_widths, is_even=(idx%2==1),
                           alignments=[WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER])

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # -------------------------------------------------------------------------
    # 3.4 PHÂN HỆ 4: QUẢN TRỊ ĐỊA ĐIỂM & ĐA ĐIỂM PHÁT
    # -------------------------------------------------------------------------
    h3_4 = doc.add_heading("3.4. Phân hệ 4: Quản Trị Đa Địa Điểm & Khách Hàng (Multi-Venue & Multi-Tenant)", level=2)
    for r in h3_4.runs:
        r.font.color.rgb = VNPT_BLUE
        r.font.size = Pt(11.5)
        r.bold = True

    t4 = doc.add_table(rows=1, cols=len(detail_headers))
    t4.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t4)
    format_table_header(t4.rows[0], detail_headers, detail_widths)

    mod4_features = [
        (1, "VEN-01", "Quản lý danh mục địa điểm phát sóng (Venues)", 
         "Thêm, sửa, xóa, tìm kiếm các địa điểm phát sóng: Trung tâm IOC, Bộ phận Một cửa, Bệnh viện đa khoa, Khách sạn, Quán cà phê...", "Bắt buộc", "Admin"),
        (2, "VEN-02", "Cấu hình nhận diện thương hiệu riêng từng điểm", 
         "Tùy biến Logo thương hiệu, màu sắc chủ đạo (Brand Color), số điện thoại Hotline, địa chỉ hiển thị trên trang chào tương ứng với từng địa điểm.", "Bắt buộc", "Admin / Manager"),
        (3, "VEN-03", "Quản lý danh sách thiết bị Router/AP theo địa điểm", 
         "Gán và quản lý số lượng phần cứng phát sóng thuộc sở hữu của từng điểm, quản lý dải IP LAN, địa chỉ MAC và vị trí lắp đặt.", "Bắt buộc", "Admin / Kỹ thuật"),
        (4, "VEN-04", "Tự động kích hoạt điểm phát mẫu (Auto-Seed Resilience)", 
         "Khi hệ thống cài mới trên máy chủ đám mây, tự động khởi tạo điểm phát mẫu chuẩn VNPT Đắk Lắk (Số 06 Lê Duẩn, Buôn Ma Thuột) để sẵn sàng phục vụ.", "Bắt buộc", "Hệ thống"),
        (5, "VEN-05", "Phân nhóm địa điểm theo khu vực địa lý / ngành nghề", 
         "Phân loại địa điểm theo Huyện/Thị xã/Thành phố hoặc theo lĩnh vực (Hành chính công, Y tế, Giáo dục, Du lịch, Bán lẻ) để phục vụ báo cáo.", "Quan trọng", "Admin")
    ]
    for idx, (stt, code, name, desc, prio, role) in enumerate(mod4_features):
        add_table_data_row(t4, [stt, code, name, desc, prio, role], detail_widths, is_even=(idx%2==1),
                           alignments=[WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER])

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # -------------------------------------------------------------------------
    # 3.5 PHÂN HỆ 5: THU THẬP & KHAI THÁC DỮ LIỆU KHÁCH HÀNG (CDP / LEADS)
    # -------------------------------------------------------------------------
    h3_5 = doc.add_heading("3.5. Phân hệ 5: Thu Thập & Khai Thác Dữ Liệu Khách Hàng (Customer Data Platform - CDP)", level=2)
    for r in h3_5.runs:
        r.font.color.rgb = VNPT_BLUE
        r.font.size = Pt(11.5)
        r.bold = True

    t5 = doc.add_table(rows=1, cols=len(detail_headers))
    t5.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t5)
    format_table_header(t5.rows[0], detail_headers, detail_widths)

    mod5_features = [
        (1, "CDP-01", "Quản lý danh bạ khách hàng tiềm năng (Leads Hub)", 
         "Bảng quản lý tập trung: Họ tên, Số điện thoại, Giới tính, Độ tuổi, Địa điểm kết nối, Thời điểm đăng nhập gần nhất.", "Bắt buộc", "Marketing / Manager"),
        (2, "CDP-02", "Định danh khách hàng quay lại (Returning Visitors)", 
         "Hệ thống tự động so khớp địa chỉ MAC thiết bị: Nhận diện khách hàng mới (New) và khách hàng thân thiết quay lại (Returning), số lần ghé thăm.", "Bắt buộc", "Hệ thống"),
        (3, "CDP-03", "Lịch sử hành vi kết nối mạng của thiết bị", 
         "Ghi nhận chi tiết lịch sử từng phiên truy cập: Thời lượng online, địa điểm kết nối, thiết bị sử dụng (iPhone, Samsung, Laptop).", "Quan trọng", "Admin / Marketing"),
        (4, "CDP-04", "Tìm kiếm, lọc & phân đoạn khách hàng", 
         "Bộ lọc dữ liệu nâng cao: Lọc theo địa điểm, theo giới tính, theo độ tuổi, theo khoảng thời gian kết nối để phục vụ tiếp thị có mục tiêu.", "Quan trọng", "Marketing"),
        (5, "CDP-05", "Xuất dữ liệu khách hàng (Export Excel/CSV)", 
         "Xuất danh sách dữ liệu khách hàng và kết quả khảo sát ra định dạng file Excel/CSV chuẩn để nhập vào các hệ thống CRM doanh nghiệp.", "Bắt buộc", "Marketing / Manager"),
        (6, "CDP-06", "Bảo mật & Mã hóa dữ liệu cá nhân (PDPA Compliance)", 
         "Tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân: Dữ liệu nhạy cảm được mã hóa an toàn, phân quyền truy cập nghiêm ngặt.", "Bắt buộc", "Hệ thống")
    ]
    for idx, (stt, code, name, desc, prio, role) in enumerate(mod5_features):
        add_table_data_row(t5, [stt, code, name, desc, prio, role], detail_widths, is_even=(idx%2==1),
                           alignments=[WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER])

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # -------------------------------------------------------------------------
    # 3.6 PHÂN HỆ 6: PHÂN TÍCH DỮ LIỆU & BÁO CÁO THÔNG MINH
    # -------------------------------------------------------------------------
    h3_6 = doc.add_heading("3.6. Phân hệ 6: Phân Tích Dữ Liệu & Báo Cáo Thông Minh (AI Analytics & BI)", level=2)
    for r in h3_6.runs:
        r.font.color.rgb = VNPT_BLUE
        r.font.size = Pt(11.5)
        r.bold = True

    t6 = doc.add_table(rows=1, cols=len(detail_headers))
    t6.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t6)
    format_table_header(t6.rows[0], detail_headers, detail_widths)

    mod6_features = [
        (1, "BI-01", "Bảng điều khiển trực quan thời gian thực (Live Dashboard)", 
         "Hiển thị các chỉ số trọng yếu: Tổng lượt truy cập (Visits), Lượt xem quảng cáo (Impressions), Số thông tin thu thập (Leads), Tỷ lệ chuyển đổi (CTR).", "Bắt buộc", "Toàn bộ"),
        (2, "BI-02", "Phân tích mật độ lưu lượng khách theo thời gian (Footfall AI)", 
         "Biểu đồ phân tích lưu lượng người dùng theo từng giờ trong ngày, ngày trong tuần, giúp nhà quản trị nhận biết khung giờ cao điểm để điều phối dịch vụ.", "Quan trọng", "Manager / Lãnh đạo"),
        (3, "BI-03", "Báo cáo cơ cấu nhân khẩu học người dùng", 
         "Biểu đồ phân bổ tỷ lệ Giới tính (Nam / Nữ) và nhóm Độ tuổi, hỗ trợ doanh nghiệp và cơ quan nhà nước hiểu rõ chân dung công dân/khách hàng.", "Quan trọng", "Marketing / Lãnh đạo"),
        (4, "BI-04", "Phân tích kết quả khảo sát & Chỉ số hài lòng (CSAT)", 
         "Tổng hợp điểm đánh giá hài lòng trung bình (thang điểm 5 sao), phân tích tỷ lệ hài lòng về hạ tầng mạng VNPT và dịch vụ công Đắk Lắk.", "Quan trọng", "Manager / Lãnh đạo"),
        (5, "BI-05", "Báo cáo so sánh hiệu quả giữa các chiến dịch / địa điểm", 
         "So sánh lượt tương tác, tỷ lệ thu hút giữa các địa điểm khác nhau hoặc giữa các mẫu banner khác nhau (A/B Testing).", "Mở rộng", "Marketing")
    ]
    for idx, (stt, code, name, desc, prio, role) in enumerate(mod6_features):
        add_table_data_row(t6, [stt, code, name, desc, prio, role], detail_widths, is_even=(idx%2==1),
                           alignments=[WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER])

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # -------------------------------------------------------------------------
    # 3.7 PHÂN HỆ 7: QUẢN TRỊ HỆ THỐNG, BẢO MẬT & API GATEWAY
    # -------------------------------------------------------------------------
    h3_7 = doc.add_heading("3.7. Phân hệ 7: Quản Trị Hệ Thống, Bảo Mật & API Gateway (System & Security)", level=2)
    for r in h3_7.runs:
        r.font.color.rgb = VNPT_BLUE
        r.font.size = Pt(11.5)
        r.bold = True

    t7 = doc.add_table(rows=1, cols=len(detail_headers))
    t7.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t7)
    format_table_header(t7.rows[0], detail_headers, detail_widths)

    mod7_features = [
        (1, "SYS-01", "Quản lý tài khoản & Phân quyền đa cấp bậc (RBAC)", 
         "Phân quyền người dùng theo vai trò: Super Admin (Quản trị toàn tỉnh), Venue Manager (Chủ địa điểm), Operator (Vận hành kỹ thuật), Viewer (Xem báo cáo).", "Bắt buộc", "Admin"),
        (2, "SYS-02", "Nhật ký kiểm toán hệ thống (Audit Trail Logs)", 
         "Ghi vết đầy đủ mọi thao tác quản trị: Thời gian, IP thực hiện, hành động sửa đổi cấu hình chiến dịch, thêm/xóa thiết bị, xuất báo cáo.", "Bắt buộc", "Admin"),
        (3, "SYS-03", "Cổng giao tiếp lập trình RESTful API Gateway", 
         "Cung cấp bộ API chuẩn RESTful cho bên thứ ba tích hợp: Khởi tạo phiên (/v1/portal/init), xác thực (/v1/portal/authorize), đồng bộ chiến dịch.", "Bắt buộc", "Nhà phát triển"),
        (4, "SYS-04", "Tài liệu kỹ thuật Swagger API trực quan tương tác", 
         "Tích hợp sẵn giao diện Swagger UI tại đường dẫn /docs, cho phép kỹ sư mạng và đối tác kiểm thử trực tiếp các hàm API trên trình duyệt.", "Bắt buộc", "Kỹ thuật / Đối tác"),
        (5, "SYS-05", "Bảo mật kết nối & Chống tấn công mạng (Cyber Security)", 
         "Mã hóa toàn bộ lưu lượng qua SSL/TLS (HTTPS), cơ chế Rate Limiting chống tấn công DoS/DDoS, CORS policy bảo vệ API.", "Bắt buộc", "Hệ thống"),
        (6, "SYS-06", "Kiểm tra tình trạng sức khỏe máy chủ (Health Checks)", 
         "Đầu mối API Health Check (/ và /health) giám sát trạng thái cơ sở dữ liệu PostgreSQL, độ trễ phản hồi, tự động cảnh báo khi có sự cố.", "Bắt buộc", "Vận hành hệ thống")
    ]
    for idx, (stt, code, name, desc, prio, role) in enumerate(mod7_features):
        add_table_data_row(t7, [stt, code, name, desc, prio, role], detail_widths, is_even=(idx%2==1),
                           alignments=[WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER])

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # =========================================================================
    # PHẦN 4: MA TRẬN PHÂN QUYỀN NGƯỜI DÙNG (RBAC MATRIX)
    # =========================================================================
    h4 = doc.add_heading("4. MA TRẬN PHÂN QUYỀN SỬ DỤNG CHỨC NĂNG (RBAC MATRIX)", level=1)
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(6)
    for r in h4.runs:
        r.font.color.rgb = VNPT_BLUE
        r.bold = True
        r.font.size = Pt(13)

    rbac_headers = ["Nhóm Chức Năng", "Super Admin (VNPT)", "Venue Manager (Chủ điểm)", "Operator (Kỹ thuật)", "Viewer / Khách hàng"]
    rbac_widths = [Inches(2.5), Inches(1.0), Inches(1.0), Inches(1.0), Inches(1.0)]
    t_rbac = doc.add_table(rows=1, cols=len(rbac_headers))
    t_rbac.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_rbac)
    format_table_header(t_rbac.rows[0], rbac_headers, rbac_widths)

    rbac_matrix = [
        ("Cấu hình hệ thống & Quản lý máy chủ", "Toàn quyền (CRUD)", "Không", "Xem trạng thái", "Không"),
        ("Tạo & Kích hoạt chiến dịch quảng cáo", "Toàn quyền (CRUD)", "Trong địa điểm của mình", "Không", "Không"),
        ("Quản lý Router / Thiết bị Gateway", "Toàn quyền (CRUD)", "Xem trạng thái", "Toàn quyền cấu hình", "Không"),
        ("Quản lý Địa điểm & Nhận diện thương hiệu", "Toàn quyền (CRUD)", "Sửa thông tin thương hiệu", "Không", "Không"),
        ("Xem & Xuất dữ liệu khách hàng (Leads CDP)", "Toàn quyền", "Xem & Xuất địa điểm mình", "Không", "Chỉ xem báo cáo ẩn danh"),
        ("Báo cáo phân tích lưu lượng (Analytics & BI)", "Toàn quyền toàn tỉnh", "Xem địa điểm của mình", "Xem kỹ thuật", "Xem biểu đồ tổng hợp")
    ]
    for idx, (role_name, sa, vm, op, vi) in enumerate(rbac_matrix):
        add_table_data_row(t_rbac, [role_name, sa, vm, op, vi], rbac_widths, is_even=(idx%2==1),
                           alignments=[WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER])

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # =========================================================================
    # PHẦN 5: CÁC TIÊU CHÍ KỸ THUẬT & YÊU CẦU PHI CHỨC NĂNG
    # =========================================================================
    h5 = doc.add_heading("5. YÊU CẦU PHI CHỨC NĂNG & TIÊU CHUẨN KỸ THUẬT", level=1)
    h5.paragraph_format.space_before = Pt(14)
    h5.paragraph_format.space_after = Pt(6)
    for r in h5.runs:
        r.font.color.rgb = VNPT_BLUE
        r.bold = True
        r.font.size = Pt(13)

    nfr_headers = ["Tiêu Chí", "Chỉ Tiêu Kỹ Thuật Cam Kết", "Giải Pháp Triển Khai Thực Tế"]
    nfr_widths = [Inches(1.8), Inches(2.2), Inches(2.5)]
    t_nfr = doc.add_table(rows=1, cols=len(nfr_headers))
    t_nfr.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_nfr)
    format_table_header(t_nfr.rows[0], nfr_headers, nfr_widths)

    nfr_data = [
        ("Thời gian tải trang chào", "< 1.5 giây trên mạng di động 4G/WiFi", "Giao diện siêu nhẹ (Next.js SSR/SSG), nén ảnh WebP, CDN caching."),
        ("Khả năng chịu tải đồng thời", "Tối thiểu 10.000 phiên kết nối đồng thời", "Backend NestJS phi đồng bộ (Non-blocking I/O), Redis Cache (tùy chọn)."),
        ("Tính sẵn sàng cao (Uptime)", "99.9% tính sẵn sàng dịch vụ", "Cơ chế Resilient Fallback tự phục vụ khi mạng suy hao, triển khai đa cụm."),
        ("Khả năng mở rộng phần cứng", "Tương thích 100% router chuẩn quốc tế", "Độc lập phần cứng, giao tiếp qua HTTP Redirect, RADIUS và RESTful Webhook."),
        ("Tuân thủ an toàn thông tin", "Nghị định 13/2023/NĐ-CP & ISO 27001", "Mã hóa HTTPS TLS 1.3, phân quyền dữ liệu cá nhân, xóa/ẩn danh dữ liệu định kỳ.")
    ]
    for idx, (item, req, sol) in enumerate(nfr_data):
        add_table_data_row(t_nfr, [item, req, sol], nfr_widths, is_even=(idx%2==1),
                           alignments=[WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT])

    doc.add_paragraph().paragraph_format.space_after = Pt(20)

    # =========================================================================
    # SIGNATURE BLOCK
    # =========================================================================
    sig_table = doc.add_table(rows=1, cols=2)
    sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    sig_widths = [Inches(3.2), Inches(3.3)]
    for idx, c in enumerate(sig_table.rows[0].cells):
        c.width = sig_widths[idx]
        set_cell_background(c, "FFFFFF")
        set_cell_margins(c, top=80, bottom=80, left=80, right=80)
    
    p_left = sig_table.rows[0].cells[0].paragraphs[0]
    p_left.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_l1 = p_left.add_run("ĐƠN VỊ XÂY DỰNG & PHÁT TRIỂN\n")
    r_l1.bold = True
    r_l1.font.size = Pt(10)
    r_l1.font.color.rgb = VNPT_BLUE
    r_l2 = p_left.add_run("BỘ PHẬN KỸ THUẬT & CHUYỂN ĐỔI SỐ\n\n\n\n(Ký và ghi rõ họ tên)")
    r_l2.font.size = Pt(9.5)
    r_l2.font.color.rgb = MUTED_GRAY

    p_right = sig_table.rows[0].cells[1].paragraphs[0]
    p_right.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_r1 = p_right.add_run("ĐƠN VỊ PHÊ DUYỆT\n")
    r_r1.bold = True
    r_r1.font.size = Pt(10)
    r_r1.font.color.rgb = VNPT_BLUE
    r_r2 = p_right.add_run("LÃNH ĐẠO TRUNG TÂM IOC / VNPT ĐẮK LẮK\n\n\n\n(Ký và đóng dấu)")
    r_r2.font.size = Pt(9.5)
    r_r2.font.color.rgb = MUTED_GRAY

    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

if __name__ == "__main__":
    target = os.path.abspath("Danh_Sach_Chuc_Nang_Phan_Mem_WiFi_Marketing.docx")
    generate_doc(target)
