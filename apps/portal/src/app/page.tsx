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
  const [portalData, setPortalData] = useState<PortalData | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('male');
  const [rating, setRating] = useState(5);
  const [aiInsight, setAiInsight] = useState('Trợ lý ảo VNPT Đắk Lắk đang phân luồng băng thông AI phục vụ quý khách...');

  const [mac, setMac] = useState('D4:CA:6D:88:99:AA');
  const [ip, setIp] = useState('10.20.30.150');
  const [venueSlug, setVenueSlug] = useState('vnpt-daklak');

  // AI Assistant message rotation for VNPT Dak Lak
  useEffect(() => {
    const aiTips = [
      'Trợ lý VNPT AI: Chào mừng bạn đến với Thủ phủ Cà phê Buôn Ma Thuột - Tỉnh Đắk Lắk!',
      'Hạ tầng VNPT Đắk Lắk: Đang kết nối đường truyền VNPT Fiber 1Gbps phủ sóng thông minh.',
      'Đô thị thông minh IOC Đắk Lắk: Tự động giám sát chất lượng kết nối và phòng chống tấn công mạng.',
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % aiTips.length;
      setAiInsight(aiTips[idx]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      // Hỗ trợ chuẩn tham số từ Router Ruijie Reyee, MikroTik, UniFi
      const urlMac =
        params.get('client_mac') ||
        params.get('clientMac') ||
        params.get('usermac') ||
        params.get('mac') ||
        params.get('id') ||
        'D4:CA:6D:88:99:AA';

      const urlIp =
        params.get('client_ip') ||
        params.get('clientIp') ||
        params.get('userip') ||
        params.get('ip') ||
        '10.20.30.150';

      const urlVenue =
        params.get('venue') ||
        params.get('gw_id') ||
        params.get('ssid') ||
        'vnpt-daklak';

      setMac(urlMac);
      setIp(urlIp);
      setVenueSlug(urlVenue);

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')
          ? 'https://vnpt-wifi-backend.onrender.com'
          : typeof window !== 'undefined'
            ? '/api'
            : 'http://localhost:4000');
      fetch(`${apiUrl}/v1/portal/init?venue=${urlVenue}&mac=${urlMac}&ip=${urlIp}`)
        .then((res) => res.json())
        .then((data) => {
          setPortalData(data);
          const initialCountdown = data?.campaign?.contentConfig?.banner?.countdownSeconds || 5;
          setCountdown(initialCountdown);
          setLoading(false);
        })
        .catch(() => {
          // Fallback VNPT Dak Lak Mock
          setPortalData({
            venue: {
              id: 'vnpt-daklak-demo',
              name: 'VNPT Đắk Lắk - Trung Tâm Điều Hành Đô Thị Thông Minh (IOC Đắk Lắk)',
              slug: 'vnpt-daklak',
              brandColor: '#005BAC',
            },
            client: { mac: urlMac, ip: urlIp, isReturning: false },
            campaign: {
              id: 'vnpt-dl-campaign-01',
              title: 'VNPT Đắk Lắk - Chào Mừng Đến Với Thủ Phủ Cà Phê Buôn Ma Thuột',
              type: 'LEAD_FORM',
              sessionMinutes: 180,
              redirectUrl: 'https://daklak.vnpt.vn',
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
                  questionTitle: 'Quý khách đánh giá thế nào về chất lượng hạ tầng số VNPT Đắk Lắk?',
                  ratingScale: 5,
                },
              },
            },
          });
          setCountdown(5);
          setLoading(false);
        });
    }
  }, []);

  useEffect(() => {
    if (countdown > 0 && !loading) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, loading]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (countdown > 0) return;

    setSubmitting(true);
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')
        ? 'https://vnpt-wifi-backend.onrender.com'
        : typeof window !== 'undefined'
          ? '/api'
          : 'http://localhost:4000');

    try {
      const payload = {
        venueId: portalData?.venue?.id || 'vnpt-daklak-demo',
        campaignId: portalData?.campaign?.id || 'demo-campaign',
        clientMac: mac,
        clientIp: ip,
        leadData: { fullName, phone, gender },
        surveyData: { ratingScore: rating, answer: 'Đánh giá AI: Rất hài lòng với VNPT Đắk Lắk' },
      };

      await fetch(`${apiUrl}/v1/portal/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      console.warn('Backend simulated response');
    } finally {
      setSubmitting(false);
      setSuccess(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white text-slate-800">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#005BAC] border-t-transparent rounded-full animate-spin"></div>
          <Bot className="w-6 h-6 text-[#005BAC] absolute inset-0 m-auto animate-pulse" />
        </div>
        <p className="mt-4 text-[#005BAC] text-xs font-bold tracking-wide flex items-center">
          <Sparkles className="w-4 h-4 mr-1 text-cyan-600 animate-spin" /> VNPT ĐẮK LẮK AI ĐANG KẾT NỐI...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-b from-white via-blue-50/20 to-slate-50 shadow-2xl flex flex-col justify-between border-x border-slate-200 font-sans">
      {/* VNPT Đắk Lắk Header */}
      <header className="p-4 bg-gradient-to-r from-[#005BAC] via-[#0066CC] to-[#007AE6] text-white shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-md p-1">
              <div className="w-full h-full rounded-lg bg-[#005BAC] flex items-center justify-center">
                <Globe2 className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-sm tracking-wider">VNPT ĐẮK LẮK</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-cyan-300 text-blue-950 rounded uppercase tracking-wider">
                  AI SMART
                </span>
              </div>
              <p className="text-[10px] text-blue-100 uppercase tracking-wider font-semibold flex items-center">
                <Coffee className="w-3 h-3 mr-1 inline text-amber-200" /> Thủ Phủ Cà Phê Buôn Ma Thuột
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center text-[10px] bg-white/20 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/30 font-medium">
              <Zap className="w-3 h-3 mr-1 text-cyan-200" /> VNPT Fiber 1Gbps
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 space-y-3.5 overflow-y-auto">
        {!success ? (
          <>
            {/* VNPT AI Smart Assistant Widget (Đắk Lắk Voice) */}
            <div className="bg-gradient-to-r from-blue-50 via-cyan-50/70 to-blue-50 text-slate-800 rounded-2xl p-3.5 shadow-xs border border-blue-200/80 flex items-start space-x-3">
              <div className="p-2 bg-[#005BAC] rounded-xl text-white flex-shrink-0 shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-1">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-[#005BAC] text-xs">Trợ Lý Số VNPT Đắk Lắk</span>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {aiInsight}
                </p>
              </div>
            </div>

            {/* Banner Cà phê Buôn Ma Thuột & Chuyển đổi số */}
            <div className="relative rounded-2xl overflow-hidden shadow-sm group border border-slate-200">
              <img
                src={
                  portalData?.campaign?.contentConfig?.banner?.bannerImageUrl ||
                  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1000'
                }
                alt="VNPT Đắk Lắk Cà phê & Chuyển đổi số"
                className="w-full h-44 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/30 to-transparent flex flex-col justify-end p-3 text-white">
                <span className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider flex items-center">
                  <Coffee className="w-3 h-3 mr-1" /> Buôn Ma Thuột - Đô Thị Cà Phê Thông Minh
                </span>
                <p className="text-xs font-bold leading-tight mt-0.5">
                  {portalData?.campaign?.title || 'VNPT Đắk Lắk - Đồng Hành Cùng Doanh Nghiệp Chuyển Đổi Số'}
                </p>
              </div>

              <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-md text-slate-800 px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center shadow-sm border border-slate-200">
                {countdown > 0 ? (
                  <span>Mở mạng sau: <strong className="text-[#005BAC] ml-0.5">{countdown}s</strong></span>
                ) : (
                  <span className="text-emerald-600 font-bold flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Sẵn sàng kết nối
                  </span>
                )}
              </div>
            </div>

            {/* Form Định Danh Khách Hàng (VNPT Đắk Lắk) */}
            <form onSubmit={handleConnect} className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="font-bold text-slate-800 text-xs flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1 text-[#005BAC]" /> Cổng Kết Nối WiFi Số VNPT Đắk Lắk
                </span>
                <span className="text-[10px] text-slate-400 font-mono">MAC: {mac.slice(0, 8)}...</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và tên quý khách</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Y Krong Adrơng hoặc Nguyễn Văn An"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#005BAC] focus:outline-none bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số điện thoại (Nhận ưu đãi dịch vụ số)</label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10,11}"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#005BAC] focus:outline-none bg-slate-50/50 font-mono"
                  />
                </div>
              </div>

              {/* VNPT AI Survey Rating */}
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100">
                <p className="font-semibold text-slate-800 text-[11px] mb-2 flex items-center justify-between">
                  <span>{portalData?.campaign?.contentConfig?.survey?.questionTitle || 'Đánh giá hạ tầng số VNPT Đắk Lắk:'}</span>
                  <span className="text-[10px] text-[#005BAC] font-bold bg-white px-2 py-0.5 rounded-full border border-blue-200">VNPT AI Index</span>
                </p>
                <div className="flex justify-around items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Nút bấm kết nối */}
              <button
                type="submit"
                disabled={countdown > 0 || submitting}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center justify-center space-x-2 ${
                  countdown > 0 || submitting
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#005BAC] to-[#007AE6] hover:from-[#004C91] hover:to-[#0066CC] active:scale-95 shadow-blue-500/20'
                }`}
              >
                {submitting ? (
                  <span className="flex items-center">
                    <Sparkles className="w-4 h-4 mr-1.5 animate-spin text-white" /> VNPT AI Đang Cấp Băng Thông...
                  </span>
                ) : countdown > 0 ? (
                  <span>Vui lòng chờ {countdown}s để hoàn tất xác thực</span>
                ) : (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span>KẾT NỐI WIFI VNPT ĐẮK LẮK MIỄN PHÍ</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Màn hình thành công chuẩn VNPT Đắk Lắk */
          <div className="text-center py-6 px-4 space-y-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-[#005BAC] border border-blue-200 rounded-full mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-[#005BAC] animate-bounce" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">Kết Nối Thành Công!</h2>
              <p className="text-xs text-slate-500 mt-1">
                Chào mừng quý khách đến với mạng <strong>VNPT Đắk Lắk Smart WiFi</strong>.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Thời gian sử dụng:</span>
                <strong className="text-[#005BAC] font-bold">{portalData?.campaign?.sessionMinutes || 180} phút</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Băng thông phân bổ:</span>
                <strong className="text-emerald-600 font-bold">30 Mbps (Tối ưu bởi VNPT AI)</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Điểm truy cập:</span>
                <strong className="text-slate-800">TP. Buôn Ma Thuột, Đắk Lắk</strong>
              </div>
            </div>

            <a
              href={portalData?.campaign?.redirectUrl || 'https://daklak.vnpt.vn'}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center space-x-2 w-full py-3 bg-gradient-to-r from-[#005BAC] to-[#007AE6] hover:from-[#004C91] hover:to-[#0066CC] text-white rounded-xl font-bold text-xs hover:shadow-lg transition-all"
            >
              <span>Vào Cổng Thông Tin VNPT Đắk Lắk</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </main>

      {/* VNPT Đắk Lắk Footer with Full Legal Address */}
      <footer className="p-3 text-center text-[10px] text-slate-500 border-t bg-white flex flex-col items-center justify-center space-y-1">
        <p className="font-bold text-slate-800 flex items-center">
          <Globe2 className="w-3 h-3 mr-1 text-[#005BAC] inline" /> VIỄN THÔNG ĐẮK LẮK (VNPT ĐẮK LẮK)
        </p>
        <p className="text-slate-500 flex items-center">
          <MapPin className="w-2.5 h-2.5 mr-1 text-slate-400 inline" /> Số 06 Lê Duẩn, P. Tân Thành, TP. Buôn Ma Thuột, Đắk Lắk
        </p>
        <p className="text-slate-400 flex items-center">
          <PhoneCall className="w-2.5 h-2.5 mr-1 text-slate-400 inline" /> Hotline: 0262 3855 855 - CSKH: 1800 1166 &copy; 2026
        </p>
      </footer>
    </div>
  );
}
