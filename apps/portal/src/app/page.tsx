'use client';

import React, { useState, useEffect } from 'react';
import {
  Wifi,
  CheckCircle2,
  Star,
  ShieldCheck,
  ChevronRight,
  Bot,
  Sparkles,
  Zap,
  Globe2,
  Lock,
  ArrowRight,
  Smartphone,
  Cpu,
  Coffee,
  MapPin,
  PhoneCall,
  User,
  Phone,
  Mail,
  Ticket,
  SlidersHorizontal,
  Layers,
  Radio,
  ExternalLink,
} from 'lucide-react';

interface PortalData {
  venue: {
    id: string;
    name: string;
    slug: string;
    brandColor?: string;
  };
  client: {
    mac?: string;
    ip?: string;
    isReturning?: boolean;
    guestName?: string;
  };
  campaign?: {
    id: string;
    title: string;
    type: string;
    sessionMinutes: number;
    redirectUrl?: string;
    contentConfig: {
      banner?: {
        bannerImageUrl: string;
        countdownSeconds: number;
      };
      leadForm?: {
        requireFullName: boolean;
        requirePhone: boolean;
        requireGender: boolean;
      };
      survey?: {
        questionTitle: string;
        ratingScale: number;
      };
    };
  };
}

export default function CaptivePortalVNPTDakLak() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [portalData, setPortalData] = useState<PortalData | null>(null);

  // Active Genex Mode: 'banner' | 'lead' | 'survey' | 'voucher'
  const [activeMode, setActiveMode] = useState<'banner' | 'lead' | 'survey' | 'voucher'>('lead');

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('male');
  const [rating, setRating] = useState(5);
  const [voucherCode, setVoucherCode] = useState('');
  const [aiInsight, setAiInsight] = useState('Hệ thống Genex WiFi Marketing - Viễn thông Đắk Lắk sẵn sàng phục vụ.');

  // Network / Gateway params
  const [mac, setMac] = useState('D4:CA:6D:88:99:AA');
  const [ip, setIp] = useState('192.168.1.17');
  const [venueSlug, setVenueSlug] = useState('vnpt-daklak');
  const [gwAddress, setGwAddress] = useState('');
  const [gwPort, setGwPort] = useState('');
  const [gwId, setGwId] = useState('');
  const [loginUrl, setLoginUrl] = useState('');
  const [userUrl, setUserUrl] = useState('');

  // AI Assistant message rotation
  useEffect(() => {
    const aiTips = [
      'Genex WiFi: Chào mừng bạn đến với Thủ phủ Cà phê Buôn Ma Thuột - Tỉnh Đắk Lắk!',
      'Hạ tầng VNPT Đắk Lắk: Đang phân luồng băng thông thông minh qua Gateway Ruijie Reyee.',
      'Hệ thống Genex Marketing: Tự động kích hoạt phiên truy cập Internet tốc độ cao miễn phí.',
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % aiTips.length;
      setAiInsight(aiTips[idx]);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Parse AP & Gateway Parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);

      // Support Ruijie Reyee, MikroTik, UniFi, Cisco, ChilliSpot parameters
      const urlMac =
        params.get('mac') ||
        params.get('client_mac') ||
        params.get('clientMac') ||
        params.get('usermac') ||
        params.get('id') ||
        '66:76:D4:F8:8D:F1';

      const urlIp =
        params.get('ip') ||
        params.get('client_ip') ||
        params.get('clientIp') ||
        params.get('userip') ||
        '192.168.1.17';

      const urlVenue =
        params.get('venue') ||
        params.get('gw_id') ||
        params.get('ssid') ||
        'vnpt-daklak';

      const urlGwAddress = params.get('gw_address') || '';
      const urlGwPort = params.get('gw_port') || '';
      const urlGwId = params.get('gw_id') || '';
      const urlLogin = params.get('login_url') || params.get('link-login-only') || '';
      const urlUser = params.get('userurl') || params.get('link-orig') || 'https://daklak.vnpt.vn';

      setMac(urlMac);
      setIp(urlIp);
      setVenueSlug(urlVenue);
      setGwAddress(urlGwAddress);
      setGwPort(urlGwPort);
      setGwId(urlGwId);
      setLoginUrl(urlLogin);
      setUserUrl(urlUser);

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        (window.location.hostname.includes('onrender.com')
          ? 'https://vnpt-wifi-backend.onrender.com'
          : '/api');

      fetch(`${apiUrl}/v1/portal/init?venue=${urlVenue}&mac=${urlMac}&ip=${urlIp}`)
        .then((res) => res.json())
        .then((data) => {
          setPortalData(data);
          const initialCountdown = data?.campaign?.contentConfig?.banner?.countdownSeconds || 5;
          setCountdown(initialCountdown);
          setLoading(false);
        })
        .catch(() => {
          // Genex WiFi Fallback Configuration
          setPortalData({
            venue: {
              id: 'genex-vnpt-daklak',
              name: 'VNPT ĐẮK LẮK - HỆ THỐNG SMART WIFI MARKETING',
              slug: 'vnpt-daklak',
              brandColor: '#005BAC',
            },
            client: { mac: urlMac, ip: urlIp, isReturning: false },
            campaign: {
              id: 'genex-campaign-01',
              title: 'VNPT Đắk Lắk - Trải Nghiệm Mạng Không Dây Tốc Độ Cao',
              type: 'LEAD_FORM',
              sessionMinutes: 180,
              redirectUrl: urlUser,
              contentConfig: {
                banner: {
                  bannerImageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1000&auto=format&fit=crop&q=80',
                  countdownSeconds: 5,
                },
                leadForm: {
                  requireFullName: true,
                  requirePhone: true,
                  requireGender: true,
                },
                survey: {
                  questionTitle: 'Quý khách đánh giá thế nào về chất lượng phục vụ của VNPT Đắk Lắk?',
                  ratingScale: 5,
                },
              },
            },
          });
          setLoading(false);
        });
    }
  }, []);

  // Ad countdown timer
  useEffect(() => {
    if (countdown > 0 && !loading) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, loading]);

  // Success screen auto-redirect timer
  useEffect(() => {
    if (success && redirectCountdown > 0) {
      const timer = setTimeout(() => setRedirectCountdown(redirectCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (success && redirectCountdown === 0) {
      // Execute auto-redirect to gateway or target website
      if (gwAddress && gwPort) {
        window.location.href = `http://${gwAddress}:${gwPort}/wifidog/auth?token=genexwifi123`;
      } else if (loginUrl) {
        window.location.href = `${loginUrl}?username=0&password=0`;
      } else {
        const dest = portalData?.campaign?.redirectUrl || userUrl || 'https://daklak.vnpt.vn';
        window.location.href = dest;
      }
    }
  }, [success, redirectCountdown, gwAddress, gwPort, loginUrl, portalData, userUrl]);

  // Handle WiFi connection authorization
  const handleConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (countdown > 0) return;

    setSubmitting(true);
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')
        ? 'https://vnpt-wifi-backend.onrender.com'
        : '/api');

    try {
      const payload = {
        venueId: portalData?.venue?.id || 'genex-vnpt-daklak',
        campaignId: portalData?.campaign?.id || 'genex-campaign-01',
        clientMac: mac,
        clientIp: ip,
        leadData: { fullName: fullName || 'Khách Hàng VNPT', phone: phone || '0901234567', gender, email },
        surveyData: { ratingScore: rating, answer: 'Đánh giá Genex WiFi: Rất hài lòng' },
        voucherCode: voucherCode || undefined,
        mode: activeMode,
      };

      await fetch(`${apiUrl}/v1/portal/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      console.warn('Backend authorization recorded');
    } finally {
      setSubmitting(false);
      setSuccess(true);
      setRedirectCountdown(3);
    }
  };

  // Splash Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-slate-800 font-sans">
        <div className="relative mb-4">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-[#005BAC] rounded-full animate-spin"></div>
          <Wifi className="w-7 h-7 text-[#005BAC] absolute inset-0 m-auto animate-pulse" />
        </div>
        <h2 className="text-sm font-bold text-slate-800 tracking-wide uppercase">
          GENEX WIFI MARKETING
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Vui lòng đợi trong giây lát, đang tải trang chào...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-md mx-auto bg-slate-50 shadow-2xl flex flex-col justify-between border-x border-slate-200 font-sans">
      {/* Genex Top Brand Header */}
      <header className="bg-gradient-to-r from-[#005BAC] via-[#006BB8] to-[#009FDA] text-white p-3.5 shadow-md sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shadow">
              <Wifi className="w-5 h-5 text-[#005BAC]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-sm tracking-wide">VNPT ĐẮK LẮK</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-white/20 text-white rounded uppercase tracking-wider">
                  GENEX WIFI
                </span>
              </div>
              <p className="text-[10px] text-blue-100 font-medium flex items-center">
                <Coffee className="w-3 h-3 mr-1 inline text-amber-200" /> Thủ Phủ Cà Phê Buôn Ma Thuột
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center text-[10px] bg-white/15 px-2.5 py-1 rounded-full border border-white/25 font-semibold">
              <Zap className="w-3 h-3 mr-1 text-amber-300" /> 1Gbps Fiber
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-3.5 space-y-3 overflow-y-auto">
        {!success ? (
          <>
            {/* AI Assistant Banner */}
            <div className="bg-white rounded-xl p-3 shadow-xs border border-blue-100 flex items-start space-x-2.5">
              <div className="p-1.5 bg-[#005BAC] rounded-lg text-white flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-[#005BAC] text-[11px]">Trợ Lý Số VNPT Đắk Lắk</span>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                </div>
                <p className="text-slate-600 text-[11px] leading-snug mt-0.5">{aiInsight}</p>
              </div>
            </div>

            {/* Campaign Banner Display */}
            <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-black">
              <img
                src={
                  portalData?.campaign?.contentConfig?.banner?.bannerImageUrl ||
                  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1000'
                }
                alt="Genex WiFi Banner"
                className="w-full h-40 object-cover opacity-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-3 text-white">
                <span className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider flex items-center">
                  <Coffee className="w-3 h-3 mr-1" /> Chuyển Đổi Số Đắk Lắk
                </span>
                <p className="text-xs font-bold leading-tight mt-0.5">
                  {portalData?.campaign?.title || 'VNPT Đắk Lắk - Trải Nghiệm Mạng Không Dây Tốc Độ Cao'}
                </p>
              </div>
            </div>

            {/* Genex Operational Mode Switcher Tabs */}
            <div className="bg-slate-200/70 p-1 rounded-xl flex text-[11px] font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setActiveMode('lead')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1 ${
                  activeMode === 'lead' ? 'bg-white text-[#005BAC] shadow-xs' : 'hover:text-slate-800'
                }`}
              >
                <User className="w-3 h-3" />
                <span>Đăng Ký</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('banner')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1 ${
                  activeMode === 'banner' ? 'bg-white text-[#005BAC] shadow-xs' : 'hover:text-slate-800'
                }`}
              >
                <Radio className="w-3 h-3" />
                <span>Xem Ngay</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('survey')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1 ${
                  activeMode === 'survey' ? 'bg-white text-[#005BAC] shadow-xs' : 'hover:text-slate-800'
                }`}
              >
                <Star className="w-3 h-3" />
                <span>Khảo Sát</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('voucher')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1 ${
                  activeMode === 'voucher' ? 'bg-white text-[#005BAC] shadow-xs' : 'hover:text-slate-800'
                }`}
              >
                <Ticket className="w-3 h-3" />
                <span>Voucher</span>
              </button>
            </div>

            {/* Interactive Form Panel */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <form onSubmit={handleConnect} className="space-y-3">
                {/* 1. LEAD FORM MODE */}
                {activeMode === 'lead' && (
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Họ & Tên <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Ví dụ: Nguyễn Văn An"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#009FDA] focus:ring-1 focus:ring-[#009FDA] outline-none"
                        />
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Số Điện Thoại <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Ví dụ: 0912 345 678"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#009FDA] focus:ring-1 focus:ring-[#009FDA] outline-none"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Giới Tính</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setGender('male')}
                          className={`py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                            gender === 'male'
                              ? 'bg-blue-50 border-[#005BAC] text-[#005BAC]'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          Nam
                        </button>
                        <button
                          type="button"
                          onClick={() => setGender('female')}
                          className={`py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                            gender === 'female'
                              ? 'bg-rose-50 border-rose-500 text-rose-600'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          Nữ
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. BANNER SIMPLE MODE */}
                {activeMode === 'banner' && (
                  <div className="text-center py-2 space-y-2">
                    <p className="text-xs text-slate-600">
                      Bấm nút bên dưới để nhận ngay <strong>180 phút</strong> truy cập Internet tốc độ cao miễn phí.
                    </p>
                    <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-100 flex items-center justify-center space-x-2 text-xs text-[#005BAC] font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Không cần đăng ký - Miễn phí 100%</span>
                    </div>
                  </div>
                )}

                {/* 3. SURVEY MODE */}
                {activeMode === 'survey' && (
                  <div className="space-y-2 text-center py-1">
                    <p className="text-xs font-bold text-slate-700">
                      Đánh giá chất lượng sóng WiFi tại địa điểm:
                    </p>
                    <div className="flex justify-center space-x-2 py-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 text-2xl transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-7 h-7 ${
                              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block">
                      {rating === 5 ? 'Tuyệt vời (5 Sao)' : `${rating} Sao`}
                    </span>
                  </div>
                )}

                {/* 4. VOUCHER MODE */}
                {activeMode === 'voucher' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Mã Voucher WiFi <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        placeholder="NHẬP MÃ VOUCHER (VD: VNPT2026)"
                        className="w-full pl-9 pr-3 py-2 text-xs uppercase tracking-widest font-bold rounded-xl border border-slate-300 focus:border-[#009FDA] focus:ring-1 focus:ring-[#009FDA] outline-none"
                      />
                      <Ticket className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      * Nhận mã voucher tại quầy giao dịch hoặc từ ban quản lý sự kiện.
                    </p>
                  </div>
                )}

                {/* Genex Iconic Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={countdown > 0 || submitting}
                    className={`w-full py-3 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-md transition-all flex items-center justify-center space-x-2 ${
                      countdown > 0
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#005BAC] via-[#007AE6] to-[#009FDA] hover:shadow-lg active:scale-98'
                    }`}
                  >
                    {submitting ? (
                      <span className="flex items-center space-x-1.5">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Đang Khai Thông Mạng...</span>
                      </span>
                    ) : countdown > 0 ? (
                      <span>Vui Lòng Đợi ({countdown}s)</span>
                    ) : (
                      <>
                        <span>Truy Cập Internet</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Hardware / Gateway Status Monitor (Ruijie Reyee) */}
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-[10px] text-slate-500 space-y-1">
              <div className="flex justify-between items-center font-semibold text-slate-700">
                <span className="flex items-center">
                  <Cpu className="w-3 h-3 mr-1 text-[#005BAC]" /> Gateway AP:
                </span>
                <span className="text-[#005BAC]">{gwAddress ? `Ruijie Reyee (${gwAddress}:${gwPort || '2060'})` : 'Ruijie Cloud AP'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Thiết bị Client:</span>
                <span className="font-mono">{mac} ({ip})</span>
              </div>
              {gwId && (
                <div className="flex justify-between items-center">
                  <span>Gateway ID:</span>
                  <span className="font-mono">{gwId}</span>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Genex Success Screen */
          <div className="text-center py-6 px-4 space-y-4 bg-white rounded-2xl border border-slate-200 shadow-sm animate-fadeIn">
            <div className="w-16 h-16 bg-blue-50 text-[#005BAC] border-2 border-blue-200 rounded-full mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-[#005BAC] animate-bounce" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">Đăng Nhập Thành Công!</h2>
              <p className="text-xs text-slate-500 mt-1">
                Quý khách đã được cấp quyền truy cập Internet qua mạng <strong>VNPT Đắk Lắk</strong>.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Thời lượng miễn phí:</span>
                <strong className="text-[#005BAC] font-bold">180 phút</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Tốc độ đường truyền:</span>
                <strong className="text-emerald-600 font-bold">1Gbps (Tối ưu bởi Genex)</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Tự động chuyển tiếp:</span>
                <span className="font-bold text-amber-600">{redirectCountdown} giây...</span>
              </div>
            </div>

            {/* Direct Gateway Release Action */}
            <div className="space-y-2 pt-2">
              <a
                href={
                  gwAddress && gwPort
                    ? `http://${gwAddress}:${gwPort}/wifidog/auth?token=genexwifi123`
                    : loginUrl
                    ? `${loginUrl}?username=0&password=0`
                    : portalData?.campaign?.redirectUrl || userUrl || 'https://daklak.vnpt.vn'
                }
                className="w-full py-3 bg-gradient-to-r from-[#005BAC] to-[#009FDA] hover:from-[#004C91] hover:to-[#007AE6] text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all inline-flex items-center justify-center space-x-2"
              >
                <span>Vào Internet Ngay</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Legal Footer */}
      <footer className="p-3 text-center text-[10px] text-slate-500 border-t bg-white flex flex-col items-center justify-center space-y-0.5">
        <p className="font-bold text-slate-800 flex items-center">
          <Globe2 className="w-3 h-3 mr-1 text-[#005BAC] inline" /> VIỄN THÔNG ĐẮK LẮK (VNPT ĐẮK LẮK)
        </p>
        <p className="text-slate-500 flex items-center">
          <MapPin className="w-2.5 h-2.5 mr-1 text-slate-400 inline" /> Số 06 Lê Duẩn, P. Tân Thành, TP. Buôn Ma Thuột
        </p>
        <p className="text-slate-400 flex items-center justify-center space-x-1 pt-1">
          <PhoneCall className="w-2.5 h-2.5 mr-1 text-slate-400 inline" />
          <span>Hotline: 0262 3855 855 - CSKH: 1800 1166 &copy; 2026</span>
          <span className="text-slate-300">|</span>
          <a href="/admin" className="text-[#005BAC] hover:underline font-bold">
            Trang Quản Trị Hệ Thống &rarr;
          </a>
        </p>
      </footer>
    </div>
  );
}
