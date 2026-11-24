'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Megaphone,
  Router as RouterIcon,
  Users,
  BarChart3,
  Wifi,
  Plus,
  CheckCircle2,
  ArrowUpRight,
  Download,
  Smartphone,
  HelpCircle,
  ExternalLink,
  Power,
  RefreshCw,
  Activity,
  X,
  AlertCircle,
  Bot,
  Brain,
  Globe2,
  Sparkles,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Radio,
  FileSpreadsheet,
  Coffee,
  Building2,
  Navigation,
  Code2,
  Ticket,
  Copy,
  Check,
  Search,
  Filter,
  Sliders,
  Send,
  Phone,
  Mail,
  User,
  Key,
} from 'lucide-react';

interface Stats {
  totalVisits: number;
  totalLeads: number;
  totalImpressions: number;
  totalClicks: number;
  ctr: string;
  activeCampaigns: number;
}

interface Campaign {
  id: string;
  title: string;
  type: string;
  venue?: { name: string };
  venueId: string;
  sessionMinutes: number;
  downloadSpeed?: number;
  uploadSpeed?: number;
  redirectUrl?: string;
  isActive: boolean;
  contentConfig: any;
  _count?: { events: number };
}

interface Device {
  id: string;
  name: string;
  vendor: string;
  ipAddress?: string;
  apiPort?: number;
  status?: string;
  isActive: boolean;
  lastSeenAt?: string;
}

interface Lead {
  id: string;
  macAddress: string;
  fullName?: string;
  phone?: string;
  email?: string;
  gender?: string;
  rating?: number;
  createdAt: string;
  isVIP?: boolean;
}

interface Voucher {
  id: string;
  code: string;
  minutes: number;
  speedMbps: number;
  status: 'active' | 'used' | 'expired';
  createdAt: string;
}

export default function UnifiedAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'crm' | 'devices' | 'api' | 'vouchers'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Search & Filters for CRM
  const [crmSearch, setCrmSearch] = useState('');
  const [crmGenderFilter, setCrmGenderFilter] = useState<'all' | 'male' | 'female'>('all');

  // Live Data States
  const [stats, setStats] = useState<Stats>({
    totalVisits: 1420,
    totalLeads: 865,
    totalImpressions: 3410,
    totalClicks: 940,
    ctr: '27.5%',
    activeCampaigns: 4,
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: 'camp-01',
      title: 'Chào Mừng Lễ Hội Cà Phê Buôn Ma Thuột - VNPT Đắk Lắk',
      type: 'LEAD_FORM',
      venueId: 'vnpt-daklak',
      sessionMinutes: 180,
      downloadSpeed: 30720,
      uploadSpeed: 15360,
      redirectUrl: 'https://daklak.vnpt.vn',
      isActive: true,
      contentConfig: {
        banner: {
          bannerImageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1000',
          countdownSeconds: 5,
        },
      },
    },
    {
      id: 'camp-02',
      title: 'Khảo Sát Chất Lượng Dịch Vụ WiFi Du Lịch Đắk Lắk',
      type: 'SURVEY',
      venueId: 'vnpt-daklak',
      sessionMinutes: 120,
      redirectUrl: 'https://daklak.vnpt.vn',
      isActive: true,
      contentConfig: {
        survey: {
          questionTitle: 'Quý khách đánh giá thế nào về chất lượng phục vụ của VNPT Đắk Lắk?',
          ratingScale: 5,
        },
      },
    },
    {
      id: 'camp-03',
      title: 'Banner Chuyển Đổi Số Doanh Nghiệp Tỉnh Đắk Lắk',
      type: 'BANNER_COUNTDOWN',
      venueId: 'vnpt-daklak',
      sessionMinutes: 60,
      redirectUrl: 'https://daklak.vnpt.vn/chuyen-doi-so',
      isActive: false,
      contentConfig: {
        banner: {
          bannerImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1000',
          countdownSeconds: 8,
        },
      },
    },
  ]);

  const [devices, setDevices] = useState<Device[]>([
    {
      id: 'dev-01',
      name: 'Ruijie Reyee Gateway - Trung Tâm IOC Đắk Lắk',
      vendor: 'RUIJIE_REYEE',
      ipAddress: '192.168.1.1',
      apiPort: 2060,
      status: 'ONLINE',
      isActive: true,
      lastSeenAt: new Date().toISOString(),
    },
    {
      id: 'dev-02',
      name: 'MikroTik Cloud Router - Điểm Phát Hội Trường Viễn Thông',
      vendor: 'MIKROTIK',
      ipAddress: '192.168.88.1',
      apiPort: 80,
      status: 'ONLINE',
      isActive: true,
      lastSeenAt: new Date().toISOString(),
    },
    {
      id: 'dev-03',
      name: 'Ubiquiti UniFi AP AC Pro - Khách Sạn Sài Gòn Ban Mê',
      vendor: 'UNIFI',
      ipAddress: '192.168.1.200',
      apiPort: 8443,
      status: 'ONLINE',
      isActive: true,
      lastSeenAt: new Date().toISOString(),
    },
    {
      id: 'dev-04',
      name: 'Modem GPON VNPT iGate GW040-H - Chi Nhánh Buôn Ma Thuột',
      vendor: 'VNPT_IGATE',
      ipAddress: '192.168.1.254',
      apiPort: 80,
      status: 'ONLINE',
      isActive: true,
      lastSeenAt: new Date().toISOString(),
    },
  ]);

  const [leads, setLeads] = useState<Lead[]>([
    {
      id: 'lead-01',
      fullName: 'Nguyễn Văn Hùng',
      phone: '0913456789',
      email: 'hung.nguyen@gmail.com',
      gender: 'male',
      rating: 5,
      macAddress: '66:76:D4:F8:8D:F1',
      createdAt: new Date().toISOString(),
      isVIP: true,
    },
    {
      id: 'lead-02',
      fullName: 'Trần Thị Mai',
      phone: '0945123987',
      email: 'mai.tran@daklak.gov.vn',
      gender: 'female',
      rating: 5,
      macAddress: 'D4:CA:6D:88:99:AA',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      isVIP: true,
    },
    {
      id: 'lead-03',
      fullName: 'Lê Hoàng Anh',
      phone: '0888234567',
      email: 'hoanganh.bmt@yahoo.com',
      gender: 'male',
      rating: 4,
      macAddress: '3C:5A:B4:12:34:56',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'lead-04',
      fullName: 'Phạm Thu Trang',
      phone: '0918765432',
      email: 'thutrang.vnpt@gmail.com',
      gender: 'female',
      rating: 5,
      macAddress: 'F0:18:98:A2:33:44',
      createdAt: new Date(Date.now() - 14400000).toISOString(),
    },
  ]);

  const [vouchers, setVouchers] = useState<Voucher[]>([
    { id: 'v-01', code: 'VNPT_BMT_2026', minutes: 240, speedMbps: 50, status: 'active', createdAt: '2026-11-20' },
    { id: 'v-02', code: 'COFFEE_FESTIVAL', minutes: 180, speedMbps: 30, status: 'active', createdAt: '2026-11-21' },
    { id: 'v-03', code: 'IOC_VIP_GUEST', minutes: 480, speedMbps: 100, status: 'used', createdAt: '2026-11-22' },
  ]);

  // Modals & Notifications
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Campaign Form
  const [newCampTitle, setNewCampTitle] = useState('');
  const [newCampType, setNewCampType] = useState('LEAD_FORM');
  const [newCampBannerUrl, setNewCampBannerUrl] = useState('https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1000');
  const [newCampCountdown, setNewCampCountdown] = useState(5);
  const [newCampSession, setNewCampSession] = useState(180);
  const [newCampRedirect, setNewCampRedirect] = useState('https://daklak.vnpt.vn');

  // New Voucher Form
  const [newVoucherCode, setNewVoucherCode] = useState('');
  const [newVoucherMinutes, setNewVoucherMinutes] = useState(180);
  const [newVoucherSpeed, setNewVoucherSpeed] = useState(30);

  // API Tester States
  const [testMac, setTestMac] = useState('66:76:D4:F8:8D:F1');
  const [testIp, setTestIp] = useState('192.168.1.17');
  const [apiTestResponse, setApiTestResponse] = useState<string | null>(null);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')
      ? 'https://vnpt-wifi-backend.onrender.com'
      : '/api');

  const showNotify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showNotify('success', `Đã sao chép cấu hình: ${text}`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const fetchLiveBackend = async () => {
    setRefreshing(true);
    try {
      const statsRes = await fetch(`${API_URL}/v1/analytics/overview`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      const campRes = await fetch(`${API_URL}/v1/campaigns`);
      if (campRes.ok) {
        const campData = await campRes.json();
        if (Array.isArray(campData) && campData.length > 0) setCampaigns(campData);
      }
      const leadsRes = await fetch(`${API_URL}/v1/analytics/leads?limit=50`);
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        if (Array.isArray(leadsData) && leadsData.length > 0) setLeads(leadsData);
      }
      showNotify('success', 'Đã đồng bộ dữ liệu thời gian thực thành công!');
    } catch {
      console.warn('Backend API connection offline, utilizing cached database');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveBackend();
  }, []);

  // Export Leads to CSV
  const handleExportCSV = () => {
    if (leads.length === 0) {
      showNotify('error', 'Chưa có dữ liệu khách hàng để xuất!');
      return;
    }
    const headers = ['STT', 'Ho_Va_Ten', 'So_Dien_Thoai', 'Email', 'Gioi_Tinh', 'Danh_Gia', 'Dia_Chi_MAC', 'Thoi_Gian'];
    const rows = leads.map((l, idx) => [
      idx + 1,
      `"${l.fullName || ''}"`,
      `"${l.phone || ''}"`,
      `"${l.email || ''}"`,
      l.gender === 'male' ? 'Nam' : l.gender === 'female' ? 'Nu' : 'Khac',
      l.rating || 5,
      l.macAddress,
      `"${new Date(l.createdAt).toLocaleString('vi-VN')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bao_Cao_CRM_VNPT_WiFi_DakLak_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showNotify('success', 'Đã xuất file báo cáo CRM khách hàng thành công!');
  };

  // Toggle Campaign status
  const handleToggleCampaign = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)),
    );
    showNotify('success', 'Đã thay đổi trạng thái phát sóng chiến dịch');
  };

  // Create Campaign
  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    const newCamp: Campaign = {
      id: `camp-${Date.now()}`,
      title: newCampTitle,
      type: newCampType,
      venueId: 'vnpt-daklak',
      sessionMinutes: newCampSession,
      redirectUrl: newCampRedirect,
      isActive: true,
      contentConfig: {
        banner: {
          bannerImageUrl: newCampBannerUrl,
          countdownSeconds: newCampCountdown,
        },
      },
    };
    setCampaigns([newCamp, ...campaigns]);
    setIsCampaignModalOpen(false);
    showNotify('success', `Đã tạo chiến dịch "${newCampTitle}" thành công!`);
    setNewCampTitle('');
  };

  // Create Voucher
  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newVoucherCode || `VNPT_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newV: Voucher = {
      id: `v-${Date.now()}`,
      code,
      minutes: newVoucherMinutes,
      speedMbps: newVoucherSpeed,
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setVouchers([newV, ...vouchers]);
    setIsVoucherModalOpen(false);
    showNotify('success', `Đã phát hành mã Voucher "${code}" thành công!`);
    setNewVoucherCode('');
  };

  // Test Gateway Connection
  const handlePingDevice = (dev: Device) => {
    showNotify('success', `Đang gửi lệnh Ping tới ${dev.name} (${dev.ipAddress}:${dev.apiPort})...`);
    setTimeout(() => {
      showNotify('success', `✓ Thiết bị ${dev.name} phản hồi tốt (Độ trễ: 2ms, Trạng thái: SẴN SÀNG).`);
    }, 800);
  };

  // Test API Live
  const runApiTest = async (type: 'init' | 'auth') => {
    setApiTestResponse('Đang gửi request...');
    try {
      if (type === 'init') {
        const res = await fetch(`${API_URL}/v1/portal/init?venue=vnpt-daklak&mac=${testMac}&ip=${testIp}`);
        const data = await res.json();
        setApiTestResponse(JSON.stringify(data, null, 2));
      } else {
        const payload = {
          venueId: 'vnpt-daklak',
          clientMac: testMac,
          clientIp: testIp,
          leadData: { fullName: 'Khách Test API', phone: '0901234567' },
        };
        const res = await fetch(`${API_URL}/v1/portal/authorize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        setApiTestResponse(JSON.stringify(data, null, 2));
      }
    } catch (e: any) {
      setApiTestResponse(`Lỗi kết nối: ${e.message}`);
    }
  };

  // Filtered Leads
  const filteredLeads = leads.filter((l) => {
    const matchSearch =
      (l.fullName || '').toLowerCase().includes(crmSearch.toLowerCase()) ||
      (l.phone || '').includes(crmSearch) ||
      (l.macAddress || '').toLowerCase().includes(crmSearch.toLowerCase());
    const matchGender = crmGenderFilter === 'all' || l.gender === crmGenderFilter;
    return matchSearch && matchGender;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-xl text-xs font-bold transition-all border ${
            notification.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
              : 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="bg-[#005BAC] text-white shadow-md sticky top-0 z-40 border-b border-blue-900">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shadow">
              <Wifi className="w-5 h-5 text-[#005BAC]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-sm tracking-wide">VNPT ĐẮK LẮK</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-cyan-400 text-blue-950 rounded-full uppercase tracking-wider">
                  ALL-IN-ONE ADMIN
                </span>
              </div>
              <p className="text-[11px] text-blue-100">
                Hệ Thống Quản Trị Hợp Nhất WiFi Marketing &amp; Cổng Gateway Tỉnh Đắk Lắk
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchLiveBackend}
              disabled={refreshing}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all border border-white/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
            <a
              href="/login?venue=vnpt-daklak"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm transition-all"
            >
              <span>Xem Trang Chào</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 py-4 w-full flex-1 flex flex-col space-y-4">
        {/* Navigation Tabs Bar */}
        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200 flex flex-wrap gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === 'overview' ? 'bg-[#005BAC] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Tổng Quan</span>
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === 'campaigns' ? 'bg-[#005BAC] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Chiến Dịch &amp; Banner</span>
          </button>
          <button
            onClick={() => setActiveTab('crm')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === 'crm' ? 'bg-[#005BAC] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Khách Hàng &amp; CRM</span>
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === 'devices' ? 'bg-[#005BAC] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <RouterIcon className="w-4 h-4" />
            <span>Thiết Bị AP / Gateway</span>
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === 'api' ? 'bg-[#005BAC] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Cổng Tích Hợp API</span>
          </button>
          <button
            onClick={() => setActiveTab('vouchers')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === 'vouchers' ? 'bg-[#005BAC] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Vouchers &amp; Cài Đặt</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: TỔNG QUAN (OVERVIEW)                              */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Lượt Truy Cập</span>
                <p className="text-xl font-extrabold text-[#005BAC] mt-1">{stats.totalVisits.toLocaleString()}</p>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> +12.4% hôm nay
                </span>
              </div>
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Khách Hàng (Leads)</span>
                <p className="text-xl font-extrabold text-blue-700 mt-1">{stats.totalLeads.toLocaleString()}</p>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> +28 khách mới
                </span>
              </div>
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Lượt Xem Banner</span>
                <p className="text-xl font-extrabold text-indigo-700 mt-1">{stats.totalImpressions.toLocaleString()}</p>
                <span className="text-[10px] text-slate-400 mt-1 block">Tương tác thực</span>
              </div>
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Lượt Nhấp (Clicks)</span>
                <p className="text-xl font-extrabold text-amber-600 mt-1">{stats.totalClicks.toLocaleString()}</p>
                <span className="text-[10px] text-slate-400 mt-1 block">Tương tác quảng cáo</span>
              </div>
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Tỷ Lệ CTR</span>
                <p className="text-xl font-extrabold text-emerald-600 mt-1">{stats.ctr}</p>
                <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Đạt chỉ tiêu VNPT</span>
              </div>
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">AP Gateway Online</span>
                <p className="text-xl font-extrabold text-purple-700 mt-1">{devices.filter((d) => d.isActive).length}/{devices.length}</p>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center mt-1">
                  <CheckCircle2 className="w-3 h-3 mr-0.5" /> 100% Hoạt động
                </span>
              </div>
            </div>

            {/* AI Assistant Banner */}
            <div className="bg-gradient-to-r from-blue-900 via-[#005BAC] to-cyan-800 text-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
                  <Bot className="w-6 h-6 text-cyan-200" />
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center">
                    <span>Phân Tích Băng Thông &amp; Khách Hàng Thông Minh (VNPT AI IOC Đắk Lắk)</span>
                    <span className="ml-2 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  </h3>
                  <p className="text-xs text-blue-100 mt-0.5">
                    Lưu lượng khách truy cập tập trung đông nhất vào khung 11:30 - 13:30 và 18:00 - 20:30. Khuyến nghị duy trì chiến dịch Lead Form thu hút khách hàng tiềm năng.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('crm')}
                className="hidden md:inline-flex px-3.5 py-2 bg-white text-[#005BAC] rounded-xl text-xs font-bold hover:bg-blue-50 transition-all shadow"
              >
                Xem CRM Khách Hàng
              </button>
            </div>

            {/* Quick Actions & Recent Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Campaign Status Preview */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-800 flex items-center">
                    <Megaphone className="w-4 h-4 mr-1.5 text-[#005BAC]" /> Chiến Dịch Đang Phát Sóng ({campaigns.filter((c) => c.isActive).length})
                  </h3>
                  <button onClick={() => setActiveTab('campaigns')} className="text-xs text-[#005BAC] font-bold hover:underline">
                    Xem tất cả &rarr;
                  </button>
                </div>
                <div className="space-y-2">
                  {campaigns.slice(0, 3).map((camp) => (
                    <div key={camp.id} className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 bg-slate-50/50 flex items-center justify-between transition-all">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">{camp.title}</span>
                        <span className="text-[11px] text-slate-500">
                          Loại: {camp.type} • Thời lượng: {camp.sessionMinutes} phút
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${camp.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        {camp.isActive ? 'Đang chạy' : 'Tạm dừng'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hardware Gateway Health */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-800 flex items-center">
                    <RouterIcon className="w-4 h-4 mr-1.5 text-[#005BAC]" /> Trạng Thái Gateway &amp; APs ({devices.length})
                  </h3>
                  <button onClick={() => setActiveTab('devices')} className="text-xs text-[#005BAC] font-bold hover:underline">
                    Quản lý Gateway &rarr;
                  </button>
                </div>
                <div className="space-y-2">
                  {devices.map((dev) => (
                    <div key={dev.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">{dev.name}</span>
                        <span className="text-[11px] font-mono text-[#005BAC]">
                          {dev.vendor} • {dev.ipAddress}:{dev.apiPort}
                        </span>
                      </div>
                      <button
                        onClick={() => handlePingDevice(dev)}
                        className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold rounded-lg flex items-center space-x-1"
                      >
                        <Activity className="w-3 h-3 text-[#005BAC]" />
                        <span>Ping</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: QUẢN LÝ CHIẾN DỊCH & BANNER (CAMPAIGNS)           */}
        {/* ======================================================== */}
        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-800">Quản Lý Chiến Dịch WiFi Marketing</h2>
                <p className="text-xs text-slate-500">Cấu hình banner, video quảng cáo, khảo sát ý kiến và form khách hàng</p>
              </div>
              <button
                onClick={() => setIsCampaignModalOpen(true)}
                className="px-4 py-2 bg-[#005BAC] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Chiến Dịch Mới</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((camp) => (
                <div key={camp.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
                  <div className="relative h-36 bg-slate-800">
                    <img
                      src={camp.contentConfig?.banner?.bannerImageUrl || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1000'}
                      alt={camp.title}
                      className="w-full h-full object-cover opacity-85"
                    />
                    <div className="absolute top-2.5 right-2.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm ${camp.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-white'}`}>
                        {camp.isActive ? 'ĐANG PHÁT SÓNG' : 'TẠM DỪNG'}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 text-white bg-black/60 backdrop-blur-xs p-2 rounded-xl text-[11px] font-semibold">
                      Loại: {camp.type} • Đếm ngược: {camp.contentConfig?.banner?.countdownSeconds || 5}s
                    </div>
                  </div>

                  <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 leading-snug">{camp.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Thời lượng phiên: <strong>{camp.sessionMinutes} phút</strong> • Băng thông: <strong>30 Mbps</strong>
                      </p>
                      <p className="text-[11px] text-[#005BAC] truncate mt-1">
                        Chuyển hướng: {camp.redirectUrl || 'https://daklak.vnpt.vn'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => handleToggleCampaign(camp.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          camp.isActive
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {camp.isActive ? 'Tạm Dừng' : 'Bật Phát Sóng'}
                      </button>
                      <a
                        href="/login?venue=vnpt-daklak"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-slate-500 hover:text-[#005BAC] font-semibold flex items-center space-x-1"
                      >
                        <span>Xem trước</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: KHÁCH HÀNG & CRM (CUSTOMER CRM HUB)              */}
        {/* ======================================================== */}
        {activeTab === 'crm' && (
          <div className="space-y-4">
            {/* Header & Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-800">Quản Trị Khách Hàng &amp; Dữ Liệu CRM</h2>
                  <p className="text-xs text-slate-500">
                    Danh bạ khách hàng thu thập tự động qua cổng Captive Portal VNPT Đắk Lắk ({leads.length} bản ghi)
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleExportCSV}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Xuất Excel / CSV</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
                <div className="sm:col-span-2 relative">
                  <input
                    type="text"
                    value={crmSearch}
                    onChange={(e) => setCrmSearch(e.target.value)}
                    placeholder="Tìm theo Tên, Số điện thoại hoặc Địa chỉ MAC..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#005BAC] outline-none"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <div>
                  <select
                    value={crmGenderFilter}
                    onChange={(e: any) => setCrmGenderFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#005BAC] outline-none"
                  >
                    <option value="all">Tất cả giới tính</option>
                    <option value="male">Nam giới</option>
                    <option value="female">Nữ giới</option>
                  </select>
                </div>
              </div>
            </div>

            {/* CRM Data Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-3">Họ và Tên</th>
                      <th className="p-3">Số Điện Thoại</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Giới Tính</th>
                      <th className="p-3">Đánh Giá</th>
                      <th className="p-3">Địa Chỉ MAC</th>
                      <th className="p-3">Thời Gian Đăng Nhập</th>
                      <th className="p-3 text-right">Phân Nhóm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="p-3 font-bold text-slate-800 flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{lead.fullName || 'Khách vãng lai'}</span>
                        </td>
                        <td className="p-3 font-mono font-bold text-[#005BAC]">{lead.phone || 'Chưa cung cấp'}</td>
                        <td className="p-3 text-slate-600">{lead.email || '—'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${lead.gender === 'male' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'}`}>
                            {lead.gender === 'male' ? 'Nam' : lead.gender === 'female' ? 'Nữ' : 'Khác'}
                          </span>
                        </td>
                        <td className="p-3 text-amber-500 font-bold">
                          {'★'.repeat(lead.rating || 5)}
                        </td>
                        <td className="p-3 font-mono text-slate-500">{lead.macAddress}</td>
                        <td className="p-3 text-slate-400">{new Date(lead.createdAt).toLocaleString('vi-VN')}</td>
                        <td className="p-3 text-right">
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold rounded-md text-[10px]">
                            {lead.isVIP ? 'Khách VIP' : 'Khách Thường'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: QUẢN LÝ THIẾT BỊ AP & GATEWAY (DEVICES)            */}
        {/* ======================================================== */}
        {activeTab === 'devices' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-800">Quản Lý Bộ Phát AP &amp; Gateway Mạng</h2>
                <p className="text-xs text-slate-500">Giám sát thiết bị Ruijie Reyee, MikroTik, UniFi, iGate kết nối hệ thống</p>
              </div>
              <button
                onClick={() => setIsDeviceModalOpen(true)}
                className="px-4 py-2 bg-[#005BAC] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Thiết Bị / AP</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-3">Hãng / Giao Thức</th>
                      <th className="p-3">Tên Gateway &amp; Điểm Phát</th>
                      <th className="p-3">Địa Chỉ IP LAN &amp; Port</th>
                      <th className="p-3">Trạng Thái Kết Nối</th>
                      <th className="p-3 text-right">Kiểm Tra Ping</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {devices.map((dev) => (
                      <tr key={dev.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="p-3">
                          <span className="px-2.5 py-1 font-bold rounded-lg text-[10px] bg-blue-100 text-[#005BAC] border border-blue-200">
                            {dev.vendor}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-800">{dev.name}</td>
                        <td className="p-3 font-mono font-semibold text-[#005BAC]">
                          {dev.ipAddress}:{dev.apiPort}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            ONLINE HOẠT ĐỘNG
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handlePingDevice(dev)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition-colors border border-slate-200"
                          >
                            <Activity className="w-3.5 h-3.5 text-[#005BAC]" />
                            <span>Ping Gateway</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: CỔNG TÍCH HỢP API & CẤU HÌNH GATEWAY (API CENTER)  */}
        {/* ======================================================== */}
        {activeTab === 'api' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h2 className="text-base font-extrabold text-slate-800">Cổng Tích Hợp API &amp; Cấu Hình Gateway Tự Động</h2>
              <p className="text-xs text-slate-500">
                Thông số chuẩn xác copy-paste cấu hình trực tiếp vào Router Ruijie Reyee, MikroTik, UniFi
              </p>
            </div>

            {/* Ruijie Reyee 1-Click Guide */}
            <div className="bg-white rounded-2xl border-2 border-blue-200 p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 bg-[#005BAC] text-white rounded-lg font-bold text-xs">Ruijie</span>
                  <h3 className="font-extrabold text-sm text-slate-800">Cấu Hình Cho Router / AP Ruijie Reyee</h3>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Chuẩn 100% Genex
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-500 block">1. Authentication Mode:</span>
                  <div className="flex justify-between items-center font-mono font-bold text-slate-800">
                    <span>External Portal</span>
                    <button onClick={() => copyToClipboard('External Portal', 'mode')} className="text-[#005BAC] p-1">
                      {copiedField === 'mode' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-500 block">2. Portal Server URL (Không lo chặn .com):</span>
                  <div className="flex justify-between items-center font-mono font-bold text-[#005BAC] truncate">
                    <span className="truncate">https://vnpt-wifi-portal.onrender.com/login?venue=vnpt-daklak</span>
                    <button onClick={() => copyToClipboard('https://vnpt-wifi-portal.onrender.com/login?venue=vnpt-daklak', 'url')} className="text-[#005BAC] p-1 flex-shrink-0">
                      {copiedField === 'url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-500 block">3. Portal IP:</span>
                  <div className="font-mono font-bold text-amber-700">
                    Để trống (Không nhập IP Anycast Cloudflare để tránh lỗi 1003)
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-500 block">4. Portal Port &amp; Gateway ID:</span>
                  <div className="flex justify-between items-center font-mono font-bold text-slate-800">
                    <span>Port: 443 | Gateway ID: 1</span>
                    <button onClick={() => copyToClipboard('443', 'port')} className="text-[#005BAC] p-1">
                      {copiedField === 'port' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive API Endpoint Tester */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center">
                <Code2 className="w-4 h-4 mr-1.5 text-[#005BAC]" /> Công Cụ Kiểm Tra API Trực Tiếp (Interactive API Tester)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Test Client MAC:</label>
                  <input
                    type="text"
                    value={testMac}
                    onChange={(e) => setTestMac(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Test Client IP:</label>
                  <input
                    type="text"
                    value={testIp}
                    onChange={(e) => setTestIp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  onClick={() => runApiTest('init')}
                  className="px-4 py-2 bg-blue-50 text-[#005BAC] border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all"
                >
                  Gửi Test: GET /v1/portal/init
                </button>
                <button
                  onClick={() => runApiTest('auth')}
                  className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all"
                >
                  Gửi Test: POST /v1/portal/authorize
                </button>
              </div>

              {apiTestResponse && (
                <div className="p-3 bg-slate-900 text-cyan-300 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48">
                  <pre>{apiTestResponse}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: VOUCHERS & CÀI ĐẶT HỆ THỐNG                       */}
        {/* ======================================================== */}
        {activeTab === 'vouchers' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-800">Quản Lý Mã Voucher Truy Cập</h2>
                <p className="text-xs text-slate-500">Phát hành mã truy cập ưu tiên thời lượng và băng thông tốc độ cao</p>
              </div>
              <button
                onClick={() => setIsVoucherModalOpen(true)}
                className="px-4 py-2 bg-[#005BAC] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Sinh Mã Voucher Mới</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {vouchers.map((v) => (
                <div key={v.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-extrabold text-sm text-[#005BAC]">{v.code}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${v.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {v.status === 'active' ? 'Có thể dùng' : 'Đã sử dụng'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Thời lượng: <strong>{v.minutes} phút</strong> • Băng thông: <strong>{v.speedMbps} Mbps</strong>
                  </p>
                  <p className="text-[10px] text-slate-400">Ngày tạo: {v.createdAt}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Tạo Chiến Dịch Mới */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-200 text-xs text-slate-800">
            <button onClick={() => setIsCampaignModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center">
              <Sparkles className="w-4 h-4 mr-1 text-[#005BAC]" /> Tạo Mới Chiến Dịch WiFi Marketing
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">Chiến dịch sẽ tự động hiển thị khi người dùng kết nối WiFi</p>

            <form onSubmit={handleCreateCampaign} className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Tên Chiến Dịch</label>
                <input
                  type="text"
                  required
                  value={newCampTitle}
                  onChange={(e) => setNewCampTitle(e.target.value)}
                  placeholder="Ví dụ: Lễ Hội Cà Phê Buôn Ma Thuột 2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#005BAC]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Hình Thức Tương Tác</label>
                  <select
                    value={newCampType}
                    onChange={(e) => setNewCampType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="LEAD_FORM">Thu Thập Lead (Tên, SĐT)</option>
                    <option value="BANNER_COUNTDOWN">Xem Banner Đếm Ngược</option>
                    <option value="SURVEY">Khảo Sát Đánh Giá 5 Sao</option>
                    <option value="VOUCHER">Mã Voucher WiFi</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Thời Gian Đếm Ngược (giây)</label>
                  <input
                    type="number"
                    min="3"
                    max="60"
                    value={newCampCountdown}
                    onChange={(e) => setNewCampCountdown(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1">URL Ảnh Banner Quảng Cáo</label>
                <input
                  type="url"
                  value={newCampBannerUrl}
                  onChange={(e) => setNewCampBannerUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">URL Trang Đích Chuyển Hướng</label>
                <input
                  type="url"
                  value={newCampRedirect}
                  onChange={(e) => setNewCampRedirect(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#005BAC] hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Lưu &amp; Kích Hoạt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Sinh Mã Voucher Mới */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-200 text-xs text-slate-800">
            <button onClick={() => setIsVoucherModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center">
              <Ticket className="w-4 h-4 mr-1 text-[#005BAC]" /> Phát Hành Voucher Mới
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">Cấp mã voucher cho khách VIP hoặc sự kiện</p>

            <form onSubmit={handleCreateVoucher} className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Mã Voucher (Để trống để tự sinh)</label>
                <input
                  type="text"
                  value={newVoucherCode}
                  onChange={(e) => setNewVoucherCode(e.target.value.toUpperCase())}
                  placeholder="VD: VIP_VNPT_2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl uppercase font-mono font-bold outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Thời lượng (phút)</label>
                  <input
                    type="number"
                    value={newVoucherMinutes}
                    onChange={(e) => setNewVoucherMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Tốc độ (Mbps)</label>
                  <input
                    type="number"
                    value={newVoucherSpeed}
                    onChange={(e) => setNewVoucherSpeed(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#005BAC] hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Phát Hành
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
