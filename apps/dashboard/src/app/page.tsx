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
  gender?: string;
  createdAt: string;
  visits?: Array<{
    loginAt: string;
    venue?: { name: string };
  }>;
}

export default function VNPTDakLakDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'ai-analytics' | 'campaigns' | 'devices' | 'leads' | 'guide'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Live Data States
  const [stats, setStats] = useState<Stats>({
    totalVisits: 0,
    totalLeads: 0,
    totalImpressions: 0,
    totalClicks: 0,
    ctr: '0.0%',
    activeCampaigns: 0,
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeVenue, setActiveVenue] = useState<{ id: string; name: string } | null>(null);

  // Modals
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states for new Campaign
  const [newCampTitle, setNewCampTitle] = useState('');
  const [newCampType, setNewCampType] = useState('LEAD_FORM');
  const [newCampBannerUrl, setNewCampBannerUrl] = useState('https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1000');
  const [newCampCountdown, setNewCampCountdown] = useState(5);
  const [newCampSession, setNewCampSession] = useState(180);
  const [newCampDownload, setNewCampDownload] = useState(30720);
  const [newCampUpload, setNewCampUpload] = useState(15360);
  const [newCampRedirect, setNewCampRedirect] = useState('https://daklak.vnpt.vn');

  // Form states for new Device
  const [newDevName, setNewDevName] = useState('');
  const [newDevVendor, setNewDevVendor] = useState('VNPT_IGATE');
  const [newDevIp, setNewDevIp] = useState('192.168.1.1');
  const [newDevPort, setNewDevPort] = useState(80);
  const [newDevUsername, setNewDevUsername] = useState('admin');
  const [newDevPassword, setNewDevPassword] = useState('');

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')
      ? 'https://vnpt-wifi-backend.onrender.com'
      : typeof window !== 'undefined'
        ? '/api'
        : 'http://localhost:4000');

  const showNotify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchAllData = async () => {
    setRefreshing(true);
    try {
      const venuesRes = await fetch(`${API_URL}/v1/venues`);
      const venuesData = await venuesRes.json();
      if (venuesData && venuesData.length > 0) {
        // Ưu tiên venue VNPT Đắk Lắk
        const daklak = venuesData.find((v: any) => v.slug === 'vnpt-daklak') || venuesData[0];
        setActiveVenue({ id: daklak.id, name: daklak.name });
        setDevices(daklak.devices || []);
      }

      const statsRes = await fetch(`${API_URL}/v1/analytics/overview`);
      const statsData = await statsRes.json();
      setStats(statsData);

      const campRes = await fetch(`${API_URL}/v1/campaigns`);
      const campData = await campRes.json();
      setCampaigns(
        campData.map((c: any) => ({
          ...c,
          contentConfig: typeof c.contentConfig === 'string' ? JSON.parse(c.contentConfig) : c.contentConfig,
        })),
      );

      const leadsRes = await fetch(`${API_URL}/v1/analytics/leads?limit=50`);
      const leadsData = await leadsRes.json();
      setLeads(leadsData);
    } catch {
      console.warn('Backend API connection offline, using cached data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleActivateCampaign = async (id: string, title?: string) => {
    // Cập nhật giao diện: đưa chiến dịch này lên ưu tiên cao nhất
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, isActive: true, priority: 10 }
          : { ...c, priority: 1 },
      ),
    );

    try {
      const res = await fetch(`${API_URL}/v1/campaigns/${id}/activate`, { method: 'PATCH' });
      if (res.ok) {
        showNotify('success', `Đã kích hoạt ưu tiên phát sóng chiến dịch "${title || 'Mới'}" thành công!`);
        fetchAllData();
      } else {
        showNotify('error', 'Không thể kích hoạt chiến dịch');
        fetchAllData();
      }
    } catch {
      showNotify('error', 'Không thể kết nối tới Backend API');
      fetchAllData();
    }
  };

  const handleToggleCampaign = async (id: string) => {
    // Cập nhật giao diện ngay lập tức (Optimistic Update)
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)),
    );

    try {
      const res = await fetch(`${API_URL}/v1/campaigns/${id}/toggle`, { method: 'PATCH' });
      if (res.ok) {
        showNotify('success', 'Đã cập nhật trạng thái chiến dịch thành công');
        fetchAllData();
      } else {
        showNotify('error', 'Máy chủ không thể cập nhật trạng thái');
        fetchAllData();
      }
    } catch {
      showNotify('error', 'Không thể kết nối tới Backend API');
      fetchAllData();
    }
  };

  const handleTestDevice = async (deviceId: string) => {
    try {
      showNotify('success', 'VNPT Đắk Lắk AI đang ping kiểm tra cổng kết nối thiết bị...');
      const res = await fetch(`${API_URL}/v1/venues/devices/${deviceId}/test-connection`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.reachable) {
        showNotify('success', `✓ ${data.message}`);
      } else {
        showNotify('error', `✗ ${data.message}`);
      }
      fetchAllData();
    } catch {
      showNotify('error', 'Lỗi kiểm tra thiết bị');
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    const venueId = activeVenue?.id || 'vnpt-daklak';

    try {
      const payload = {
        venueId,
        title: newCampTitle || 'Chiến Dịch Chuyển Đổi Số VNPT Đắk Lắk',
        type: newCampType,
        sessionMinutes: Number(newCampSession),
        downloadSpeed: Number(newCampDownload),
        uploadSpeed: Number(newCampUpload),
        redirectUrl: newCampRedirect,
        contentConfig: {
          banner: {
            bannerImageUrl: newCampBannerUrl,
            countdownSeconds: Number(newCampCountdown),
          },
          leadForm: {
            requireFullName: true,
            requirePhone: true,
            requireGender: true,
          },
          survey: {
            questionTitle: 'Quý khách đánh giá thế nào về chất lượng hạ tầng số VNPT Đắk Lắk?',
            ratingScale: 5,
          },
        },
      };

      const res = await fetch(`${API_URL}/v1/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        showNotify('success', `Đã kích hoạt chiến dịch "${created.title || newCampTitle}" thành công!`);
        setIsCampaignModalOpen(false);
        setNewCampTitle('');
        fetchAllData();
      } else {
        const errData = await res.json().catch(() => ({}));
        showNotify('error', errData.message || 'Lỗi khi lưu chiến dịch');
      }
    } catch {
      showNotify('error', 'Không thể kết nối Backend API');
    }
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVenue) return;

    try {
      const payload = {
        venueId: activeVenue.id,
        name: newDevName,
        vendor: newDevVendor,
        ipAddress: newDevIp,
        apiPort: Number(newDevPort),
        apiUsername: newDevUsername,
        apiPassword: newDevPassword,
      };

      const res = await fetch(`${API_URL}/v1/venues/${activeVenue.id}/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showNotify('success', 'Thêm thiết bị hạ tầng viễn thông Đắk Lắk thành công!');
        setIsDeviceModalOpen(false);
        setNewDevName('');
        fetchAllData();
      } else {
        showNotify('error', 'Lỗi khi lưu thiết bị');
      }
    } catch {
      showNotify('error', 'Không thể kết nối Backend');
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) {
      alert('Chưa có dữ liệu khách hàng để xuất');
      return;
    }

    const headers = ['Họ và Tên', 'Số Điện Thoại', 'Giới Tính', 'Địa Điểm Số Hóa', 'Thời Gian Kết Nối'];
    const rows = leads.map((l) => [
      `"${l.fullName || 'Khách vãng lai'}"`,
      `"${l.phone || ''}"`,
      `"${l.gender === 'male' ? 'Nam' : l.gender === 'female' ? 'Nữ' : 'Khác'}"`,
      `"${l.visits?.[0]?.venue?.name || activeVenue?.name || 'Chi nhánh VNPT Đắk Lắk'}"`,
      `"${new Date(l.createdAt).toLocaleString('vi-VN')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vnpt_daklak_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen bg-[#F4F7FC] text-slate-800 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl border flex items-center space-x-2 text-xs font-semibold animate-fade-in ${
            notification.type === 'success'
              ? 'bg-blue-50 text-blue-900 border-blue-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <Sparkles className="w-4 h-4 text-blue-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* VNPT Đắk Lắk Bright Sidebar */}
      <aside className="w-64 bg-white text-slate-700 flex flex-col justify-between border-r border-slate-200/80 shadow-sm">
        <div>
          {/* Brand header: VNPT Đắk Lắk */}
          <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-[#005BAC] to-[#0072CE] text-white shadow-sm">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center p-1 border border-white/30 shadow-inner">
                <Globe2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-sm tracking-wider">VNPT ĐẮK LẮK</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-cyan-300 text-blue-950 rounded uppercase shadow-sm">
                    AI
                  </span>
                </div>
                <p className="text-[10px] text-blue-100 uppercase tracking-wider font-semibold flex items-center">
                  <Coffee className="w-2.5 h-2.5 mr-1 text-amber-200 inline" /> Đô Thị Số Buôn Ma Thuột
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'overview'
                  ? 'bg-blue-50 text-[#005BAC] font-bold shadow-sm border border-blue-100'
                  : 'text-slate-600 hover:text-[#005BAC] hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Tổng quan tỉnh Đắk Lắk</span>
            </button>

            <button
              onClick={() => setActiveTab('ai-analytics')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'ai-analytics'
                  ? 'bg-blue-50 text-[#005BAC] font-bold shadow-sm border border-blue-100'
                  : 'text-slate-600 hover:text-[#005BAC] hover:bg-slate-50'
              }`}
            >
              <Brain className="w-4 h-4 text-cyan-600" />
              <span>Phân tích trí tuệ nhân tạo (AI)</span>
            </button>

            <button
              onClick={() => setActiveTab('campaigns')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'campaigns'
                  ? 'bg-blue-50 text-[#005BAC] font-bold shadow-sm border border-blue-100'
                  : 'text-slate-600 hover:text-[#005BAC] hover:bg-slate-50'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Chiến dịch truyền thông số</span>
            </button>

            <button
              onClick={() => setActiveTab('devices')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'devices'
                  ? 'bg-blue-50 text-[#005BAC] font-bold shadow-sm border border-blue-100'
                  : 'text-slate-600 hover:text-[#005BAC] hover:bg-slate-50'
              }`}
            >
              <RouterIcon className="w-4 h-4" />
              <span>Hạ tầng mạng viễn thông</span>
            </button>

            <button
              onClick={() => setActiveTab('leads')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'leads'
                  ? 'bg-blue-50 text-[#005BAC] font-bold shadow-sm border border-blue-100'
                  : 'text-slate-600 hover:text-[#005BAC] hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Dữ liệu khách hàng định danh</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'guide'
                  ? 'bg-blue-50 text-[#005BAC] font-bold shadow-sm border border-blue-100'
                  : 'text-slate-600 hover:text-[#005BAC] hover:bg-slate-50'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Cấu hình VNPT iGate & IOC</span>
            </button>
          </nav>
        </div>

        {/* Governing Agency Footer in Sidebar */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50 text-[10px] space-y-1.5">
          <div className="font-bold text-[#005BAC] flex items-center">
            <Building2 className="w-3 h-3 mr-1 inline" /> VNPT ĐẮK LẮK
          </div>
          <p className="text-slate-600">Số 06 Lê Duẩn, P. Tân Thành, TP. Buôn Ma Thuột</p>
          <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60">
            <span>IOC Đắk Lắk:</span>
            <span className="text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">Trực Tuyến</span>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F4F7FC]">
        {/* Top Header Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <span className="text-[11px] font-bold px-2.5 py-1 bg-blue-50 text-[#005BAC] border border-blue-200/80 rounded-lg flex items-center shadow-xs">
              <MapPin className="w-3.5 h-3.5 mr-1 text-[#005BAC]" /> Đơn Vị Quản Lý
            </span>
            <h2 className="font-bold text-slate-900 text-sm tracking-wide flex items-center space-x-1.5">
              <span>{activeVenue?.name || 'VNPT Đắk Lắk - Trung Tâm Điều Hành Đô Thị Thông Minh (IOC Đắk Lắk)'}</span>
            </h2>
            <button
              onClick={fetchAllData}
              disabled={refreshing}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-[#005BAC] transition-colors"
              title="Làm mới dữ liệu từ CSDL"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href="http://localhost:3000?venue=vnpt-daklak&mac=D4:CA:6D:88:99:AA"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#005BAC]" />
              <span>Xem Thử Cổng WiFi Đắk Lắk</span>
            </a>
            <button
              onClick={() => setIsCampaignModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-[#005BAC] to-[#007AE6] hover:from-[#004C91] hover:to-[#0066CC] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Chiến Dịch Số</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Body */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top KPI Cards (Clean White with VNPT Blue Accents) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lượt kết nối WiFi Đắk Lắk</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalVisits}</p>
                  <p className="text-[11px] text-[#005BAC] font-semibold mt-1 flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> Chuẩn VNPT Fiber Ultra
                  </p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-100 text-[#005BAC] rounded-xl shadow-xs">
                  <Wifi className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Định danh số (Leads)</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalLeads}</p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-0.5" /> SĐT du khách & người dân
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl shadow-xs">
                  <Smartphone className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mật độ AI Footfall</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">98.4%</p>
                  <p className="text-[11px] text-indigo-600 font-semibold mt-1">Cụm Buôn Ma Thuột</p>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl shadow-xs">
                  <Brain className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tương tác CTR</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{stats.ctr}</p>
                  <p className="text-[11px] text-amber-600 font-semibold mt-1">Tối ưu bởi VNPT AI</p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl shadow-xs">
                  <Zap className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* AI Analytics Dedicated Tab or Overview Preview */}
          {(activeTab === 'overview' || activeTab === 'ai-analytics') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* AI Recommendation Engine for Dak Lak */}
              <div className="col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-blue-50 border border-blue-200 text-[#005BAC] rounded-xl">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 flex items-center">
                        VNPT Đắk Lắk AI Smart Recommendation Engine
                      </h3>
                      <p className="text-[11px] text-slate-500">Mô hình học máy phân tích lưu lượng du lịch & sự kiện tại Đắk Lắk</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-blue-50 text-[#005BAC] border border-blue-200 rounded-full">
                    AI Buôn Ma Thuột
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-gradient-to-br from-amber-50/70 to-orange-50/40 rounded-xl border border-amber-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-amber-900 font-bold flex items-center">
                        <Coffee className="w-3.5 h-3.5 mr-1 text-amber-700" /> Điểm Nóng Du Lịch Cà Phê
                      </span>
                      <span className="text-amber-800 font-medium">Buôn Ma Thuột</span>
                    </div>
                    <p className="text-slate-700 text-[11px] leading-relaxed">
                      AI dự báo lưu lượng khách tại Cụm Quảng trường 10/3 và Làng Cà phê Trung Nguyên tăng mạnh vào dịp cuối tuần. Hệ thống tự động ưu tiên băng thông và hiển thị banner Cẩm nang du lịch Đắk Lắk.
                    </p>
                  </div>

                  <div className="p-3.5 bg-gradient-to-br from-blue-50/70 to-cyan-50/40 rounded-xl border border-blue-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#005BAC] font-bold flex items-center">
                        <TrendingUp className="w-3.5 h-3.5 mr-1 text-[#005BAC]" /> Hành Chính Công Tỉnh Đắk Lắk
                      </span>
                      <span className="text-slate-500 font-medium">08:00 - 17:00</span>
                    </div>
                    <p className="text-slate-700 text-[11px] leading-relaxed">
                      Tại Trung tâm Phục vụ Hành chính công Tỉnh, AI tự động gợi ý kích hoạt biểu mẫu khảo sát mức độ hài lòng về Dịch vụ công trực tuyến và chữ ký số từ xa VNPT SmartCA.
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Demographic breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-xs">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center">
                    <Brain className="w-4 h-4 mr-1.5 text-[#005BAC]" /> Phân Bố Lưu Lượng Điểm Nóng
                  </h3>
                  <p className="text-[11px] text-slate-500">Giám sát theo thời gian thực tại Đắk Lắk</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-700 mb-1">
                      <span>Quảng trường 10/3 Buôn Ma Thuột</span>
                      <strong className="text-[#005BAC]">3,840 kết nối</strong>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-[#005BAC] to-cyan-500 h-full rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 mb-1">
                      <span>Trung tâm Hành chính công Tỉnh</span>
                      <strong className="text-indigo-600">1,920 kết nối</strong>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 mb-1">
                      <span>Sân bay Buôn Ma Thuột</span>
                      <strong className="text-emerald-600">2,310 kết nối</strong>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: '55%' }}></div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                    <span>Hạ tầng mạng:</span>
                    <strong className="text-slate-800">Cáp quang VNPT Đắk Lắk</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Campaigns */}
          {(activeTab === 'overview' || activeTab === 'campaigns') && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Chiến Dịch Truyền Thông Số VNPT Đắk Lắk ({campaigns.length})</h3>
                  <p className="text-xs text-slate-500">Quản lý nội dung chào mừng du khách & người dân tỉnh Đắk Lắk</p>
                </div>
                <button
                  onClick={() => setIsCampaignModalOpen(true)}
                  className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#005BAC] border border-blue-200 text-xs font-bold rounded-xl flex items-center space-x-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo Mới</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="border border-slate-200/90 bg-white rounded-2xl p-4 flex space-x-4 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <img
                      src={
                        camp.contentConfig?.banner?.bannerImageUrl ||
                        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600'
                      }
                      alt="Banner"
                      className="w-28 h-28 object-cover rounded-xl flex-shrink-0 border border-slate-100"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleToggleCampaign(camp.id)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                              camp.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            <Power className="w-2.5 h-2.5 mr-1 inline" />
                            {camp.isActive ? 'HOẠT ĐỘNG' : 'TẠM DỪNG'}
                          </button>
                          <span className="text-[10px] text-[#005BAC] font-mono font-bold">{camp.type}</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 mt-1.5 line-clamp-1">{camp.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{camp.venue?.name || activeVenue?.name}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl mt-2 border border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Thời lượng phiên:</span>
                          <strong className="text-slate-800">{camp.sessionMinutes} phút</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Băng thông cấp:</span>
                          <strong className="text-[#005BAC]">
                            {camp.downloadSpeed ? `${camp.downloadSpeed / 1024}M` : 'Max'} /{' '}
                            {camp.uploadSpeed ? `${camp.uploadSpeed / 1024}M` : 'Max'}
                          </strong>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        {camp.isActive && (camp.priority || 0) >= 10 ? (
                          <span className="inline-flex items-center text-[11px] font-bold text-[#005BAC] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#005BAC] animate-pulse mr-1.5"></span>
                            Đang phát sóng chính
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleActivateCampaign(camp.id, camp.title)}
                            className="inline-flex items-center text-[11px] font-bold text-white bg-[#005BAC] hover:bg-[#004a8c] px-3 py-1 rounded-lg transition-all shadow-xs cursor-pointer"
                          >
                            <Radio className="w-3 h-3 mr-1" />
                            Kích hoạt phát sóng
                          </button>
                        )}
                        <span className="text-[10px] text-slate-400">Ưu tiên: {camp.priority || 1}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Hardware Devices */}
          {(activeTab === 'overview' || activeTab === 'devices') && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Hạ Tầng Thiết Bị Viễn Thông VNPT Đắk Lắk</h3>
                  <p className="text-xs text-slate-500">Giám sát các thiết bị Modem GPON iGate và AP tại các điểm phát trên địa bàn tỉnh</p>
                </div>
                <button
                  onClick={() => setIsDeviceModalOpen(true)}
                  className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#005BAC] border border-blue-200 text-xs font-bold rounded-xl flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Thiết Bị</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[11px]">
                      <th className="p-3">Hãng / Chuẩn</th>
                      <th className="p-3">Tên thiết bị & Vị trí</th>
                      <th className="p-3">Địa chỉ IP / Cổng</th>
                      <th className="p-3">Trạng thái kết nối</th>
                      <th className="p-3 text-right">Kiểm tra kết nối</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {devices.map((dev) => (
                      <tr key={dev.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 font-bold rounded-lg text-[10px] tracking-wide ${
                              dev.vendor === 'VNPT_IGATE'
                                ? 'bg-blue-100 text-[#005BAC] border border-blue-200'
                                : dev.vendor === 'MIKROTIK'
                                ? 'bg-indigo-100 text-indigo-700'
                                : dev.vendor === 'UNIFI'
                                ? 'bg-sky-100 text-sky-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {dev.vendor}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">{dev.name}</td>
                        <td className="p-3 font-mono text-[#005BAC]">{dev.ipAddress || '192.168.1.1'}:{dev.apiPort || 80}</td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              dev.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 mr-1.5 rounded-full ${
                                dev.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                              }`}
                            ></span>
                            {dev.isActive ? 'KẾT NỐI ONLINE' : 'CHỜ TÍN HIỆU'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleTestDevice(dev.id)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center space-x-1 inline-flex border border-slate-200 transition-colors"
                          >
                            <Activity className="w-3 h-3 text-[#005BAC]" />
                            <span>Ping Gateway</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Leads */}
          {(activeTab === 'overview' || activeTab === 'leads') && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Dữ Liệu Khách Hàng Định Danh VNPT Đắk Lắk ({leads.length})</h3>
                  <p className="text-xs text-slate-500">Khách hàng để lại thông tin khi đăng nhập WiFi số tại tỉnh Đắk Lắk</p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#005BAC] border border-blue-200 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Xuất Báo Cáo CSV</span>
                </button>
              </div>

              {leads.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[11px]">
                        <th className="p-3">Họ và tên</th>
                        <th className="p-3">Số điện thoại</th>
                        <th className="p-3">Giới tính</th>
                        <th className="p-3">Địa chỉ MAC</th>
                        <th className="p-3">Thời gian định danh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-blue-50/30">
                          <td className="p-3 font-semibold text-slate-800">{lead.fullName || 'Khách vãng lai'}</td>
                          <td className="p-3 font-mono font-bold text-[#005BAC]">{lead.phone || 'Chưa cập nhật'}</td>
                          <td className="p-3 text-slate-600">{lead.gender === 'male' ? 'Nam' : lead.gender === 'female' ? 'Nữ' : 'Khác'}</td>
                          <td className="p-3 font-mono text-slate-500">{lead.macAddress}</td>
                          <td className="p-3 text-slate-400">
                            {new Date(lead.createdAt).toLocaleString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">Chưa có dữ liệu định danh khách hàng.</p>
              )}
            </div>
          )}

          {/* Tab: Guide */}
          {activeTab === 'guide' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-6 shadow-xs">
              <h3 className="text-lg font-bold text-slate-900 flex items-center">
                <Globe2 className="w-5 h-5 mr-2 text-[#005BAC]" /> Hướng Dẫn Tích Hợp Hạ Tầng Viễn Thông VNPT Đắk Lắk
              </h3>

              <div className="space-y-4 text-xs text-slate-700">
                <div className="border border-blue-200 bg-blue-50/50 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-sm text-[#005BAC]">1. Cấu Hình Modem GPON VNPT iGate (GW040-H / GW020-H) Tại Đắk Lắk</h4>
                  <ol className="list-decimal pl-4 space-y-1.5 text-slate-700">
                    <li>Đăng nhập trang quản trị modem tại: <code>192.168.1.1</code> (Tài khoản kỹ thuật VNPT Đắk Lắk).</li>
                    <li>Vào mục <strong>Network Settings &gt; Wireless 2.4GHz / 5GHz &gt; Guest Network</strong>.</li>
                    <li>Kích hoạt SSID Khách (Ví dụ: <code>VNPT_DakLak_WiFi_AI</code>), đặt Security Mode: <strong>Open</strong>.</li>
                    <li>Trong mục Captive Portal / Web Auth: Điền địa chỉ máy chủ Portal <code>http://localhost:3000?venue=vnpt-daklak</code>.</li>
                  </ol>
                </div>

                <div className="border border-slate-200 bg-slate-50 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-sm text-slate-900">2. Kết Nối Đồng Bộ IOC Tỉnh Đắk Lắk</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Hệ thống WiFi Marketing VNPT Đắk Lắk kết nối trực tiếp với Trung tâm Giám sát Điều hành Đô thị Thông minh (IOC Đắk Lắk) tại Số 06 Lê Duẩn, TP. Buôn Ma Thuột để cung cấp dữ liệu phân tích luồng du khách và mức độ hài lòng về dịch vụ viễn thông trên địa bàn toàn tỉnh.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal: Tạo Chiến Dịch */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-200 animate-scale-up text-slate-800">
            <button
              onClick={() => setIsCampaignModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base text-slate-900 mb-1 flex items-center">
              <Sparkles className="w-4 h-4 mr-1.5 text-[#005BAC]" /> Tạo Chiến Dịch Số VNPT Đắk Lắk Mới
            </h3>
            <p className="text-xs text-slate-500 mb-4">Chiến dịch sẽ hiển thị khi khách truy cập mạng WiFi VNPT Đắk Lắk</p>

            <form onSubmit={handleCreateCampaign} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên chiến dịch chuyển đổi số</label>
                <input
                  type="text"
                  required
                  value={newCampTitle}
                  onChange={(e) => setNewCampTitle(e.target.value)}
                  placeholder="VD: Chào mừng Lễ hội Cà phê Buôn Ma Thuột - VNPT Đắk Lắk"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005BAC] focus:outline-none text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hình thức tương tác</label>
                  <select
                    value={newCampType}
                    onChange={(e) => setNewCampType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005BAC] focus:outline-none text-slate-800"
                  >
                    <option value="LEAD_FORM">Thu thập Lead (Tên, SĐT)</option>
                    <option value="BANNER_COUNTDOWN">Xem Banner Đếm Ngược</option>
                    <option value="VIDEO_WATCH">Xem Video Quảng Cáo</option>
                    <option value="ONE_CLICK">Một Chạm Kết Nối Ngay</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thời gian đếm ngược (giây)</label>
                  <input
                    type="number"
                    min="3"
                    max="60"
                    value={newCampCountdown}
                    onChange={(e) => setNewCampCountdown(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005BAC] focus:outline-none text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Đường dẫn ảnh Banner (URL)</label>
                <input
                  type="url"
                  required
                  value={newCampBannerUrl}
                  onChange={(e) => setNewCampBannerUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005BAC] focus:outline-none text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thời lượng phiên (phút)</label>
                  <input
                    type="number"
                    min="15"
                    value={newCampSession}
                    onChange={(e) => setNewCampSession(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005BAC] focus:outline-none text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tốc độ tải xuống (Kbps)</label>
                  <input
                    type="number"
                    value={newCampDownload}
                    onChange={(e) => setNewCampDownload(Number(e.target.value))}
                    placeholder="30720 = 30 Mbps"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005BAC] focus:outline-none text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">URL chuyển hướng sau khi mở mạng</label>
                <input
                  type="url"
                  value={newCampRedirect}
                  onChange={(e) => setNewCampRedirect(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005BAC] focus:outline-none text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold text-slate-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#005BAC] to-[#007AE6] hover:from-[#004C91] hover:to-[#0066CC] text-white font-bold rounded-xl shadow-md shadow-blue-500/20"
                >
                  Kích Hoạt Chiến Dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Thêm Thiết Bị Mạng */}
      {isDeviceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200 animate-scale-up text-slate-800">
            <button
              onClick={() => setIsDeviceModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base text-slate-900 mb-1">Thêm Thiết Bị Viễn Thông VNPT Đắk Lắk</h3>
            <p className="text-xs text-slate-500 mb-4">Kết nối Modem GPON VNPT iGate hoặc Access Point tại các điểm phát</p>

            <form onSubmit={handleAddDevice} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dòng thiết bị</label>
                <select
                  value={newDevVendor}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNewDevVendor(v);
                    if (v === 'VNPT_IGATE') setNewDevPort(80);
                    if (v === 'MIKROTIK') setNewDevPort(80);
                    if (v === 'UNIFI') setNewDevPort(8443);
                    if (v === 'RUIJIE') setNewDevPort(443);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005BAC] focus:outline-none text-slate-800"
                >
                  <option value="VNPT_IGATE">Modem GPON VNPT iGate (GW040-H / GW020)</option>
                  <option value="MIKROTIK">MikroTik RouterOS (Hotspot / REST API)</option>
                  <option value="UNIFI">Ubiquiti UniFi (Guest Controller)</option>
                  <option value="RUIJIE">Ruijie / Reyee Cloud (MACC OpenAPI)</option>
                  <option value="MOCK">Giả lập Mock Gateway (Testing)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên thiết bị & Vị trí lắp đặt</label>
                <input
                  type="text"
                  required
                  value={newDevName}
                  onChange={(e) => setNewDevName(e.target.value)}
                  placeholder="VD: VNPT iGate GW040-H - Quảng Trường 10/3 Buôn Ma Thuột"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005BAC] focus:outline-none text-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Địa chỉ IP thiết bị</label>
                  <input
                    type="text"
                    required
                    value={newDevIp}
                    onChange={(e) => setNewDevIp(e.target.value)}
                    placeholder="192.168.1.1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005BAC] focus:outline-none text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cổng Port</label>
                  <input
                    type="number"
                    value={newDevPort}
                    onChange={(e) => setNewDevPort(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005BAC] focus:outline-none text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsDeviceModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold text-slate-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#005BAC] to-[#007AE6] hover:from-[#004C91] hover:to-[#0066CC] text-white font-bold rounded-xl shadow-md shadow-blue-500/20"
                >
                  Thêm Thiết Bị
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
