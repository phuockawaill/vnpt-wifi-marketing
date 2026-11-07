import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GatewayService } from '../gateway/gateway.service';
import { AuthorizePortalPayload } from '@wifi-marketing/shared';

@Injectable()
export class PortalService {
  private readonly logger = new Logger(PortalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gatewayService: GatewayService,
  ) {}

  /**
   * Khởi tạo phiên trang chào, tìm địa điểm và chiến dịch phù hợp
   */
  async getPortalContext(venueSlug: string, clientMac?: string, clientIp?: string) {
    let venue = await this.prisma.venue.findUnique({
      where: { slug: venueSlug },
      include: {
        devices: { where: { isActive: true } },
        campaigns: {
          where: { isActive: true },
          orderBy: { priority: 'desc' },
        },
      },
    });

    if (!venue) {
      // Fallback về địa điểm đầu tiên có sẵn trong hệ thống (VD: VNPT Đắk Lắk)
      venue = await this.prisma.venue.findFirst({
        include: {
          devices: { where: { isActive: true } },
          campaigns: {
            where: { isActive: true },
            orderBy: { priority: 'desc' },
          },
        },
      });
    }

    if (!venue) {
      throw new NotFoundException(`Venue '${venueSlug}' not found`);
    }

    // Kiểm tra xem khách này đã từng ghé chưa
    let returningGuest = null;
    if (clientMac) {
      const cleanMac = clientMac.toUpperCase();
      returningGuest = await this.prisma.guest.findUnique({
        where: { macAddress: cleanMac },
      });
    }

    // Lựa chọn chiến dịch tối ưu: lấy chiến dịch đầu tiên đang hoạt động
    const activeCampaign = venue.campaigns[0] || null;
    let formattedCampaign = null;
    if (activeCampaign) {
      formattedCampaign = {
        ...activeCampaign,
        contentConfig:
          typeof activeCampaign.contentConfig === 'string'
            ? JSON.parse(activeCampaign.contentConfig)
            : activeCampaign.contentConfig,
      };
    }

    return {
      venue: {
        id: venue.id,
        name: venue.name,
        slug: venue.slug,
        address: venue.address,
        brandColor: venue.brandColor,
        logoUrl: venue.logoUrl,
      },
      client: {
        mac: clientMac,
        ip: clientIp,
        isReturning: !!returningGuest,
        guestName: returningGuest?.fullName || null,
      },
      campaign: formattedCampaign,
    };
  }

  /**
   * Xử lý xác thực và mở kết nối Internet cho thiết bị khách
   */
  async authorizeClient(payload: AuthorizePortalPayload) {
    const { venueId, campaignId, clientMac, clientIp, leadData, surveyData } = payload;
    const cleanMac = clientMac.toUpperCase();

    this.logger.log(`[Portal] Authorizing request for MAC: ${cleanMac} at Venue: ${venueId}`);

    // 1. Lấy thông tin Venue và Device
    let venue = null;
    let campaign = null;

    if (campaignId) {
      campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
      });
    }

    const resolvedVenueId = venueId || campaign?.venueId;

    if (resolvedVenueId) {
      venue = await this.prisma.venue.findUnique({
        where: { id: resolvedVenueId },
        include: {
          devices: { where: { isActive: true }, take: 1 },
          campaigns: { where: campaignId ? { id: campaignId } : { isActive: true } },
        },
      });
    }

    if (!venue) {
      venue = await this.prisma.venue.findFirst({
        include: {
          devices: { where: { isActive: true }, take: 1 },
          campaigns: { where: { isActive: true }, take: 1 },
        },
      });
    }

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    if (!campaign && venue.campaigns?.length > 0) {
      campaign = venue.campaigns[0];
    }
    const sessionMinutes = campaign?.sessionMinutes || 60;
    const downloadSpeed = campaign?.downloadSpeed || undefined;
    const uploadSpeed = campaign?.uploadSpeed || undefined;

    // 2. Lưu / Cập nhật thông tin Khách hàng (Leads)
    const guest = await this.prisma.guest.upsert({
      where: { macAddress: cleanMac },
      update: {
        fullName: leadData?.fullName || undefined,
        phone: leadData?.phone || undefined,
        email: leadData?.email || undefined,
        gender: leadData?.gender || undefined,
        ageRange: leadData?.ageRange || undefined,
      },
      create: {
        macAddress: cleanMac,
        fullName: leadData?.fullName || null,
        phone: leadData?.phone || null,
        email: leadData?.email || null,
        gender: leadData?.gender || null,
        ageRange: leadData?.ageRange || null,
      },
    });

    // 3. Ghi nhận lượt ghé thăm (Visit Session)
    const expiresAt = new Date(Date.now() + sessionMinutes * 60 * 1000);
    await this.prisma.guestVisit.create({
      data: {
        guestId: guest.id,
        venueId: venue.id,
        campaignId: campaign?.id,
        clientIp: clientIp,
        sessionMinutes,
        expiresAt,
      },
    });

    // 4. Lưu câu trả lời khảo sát nếu có
    if (surveyData && campaign) {
      const config =
        typeof campaign.contentConfig === 'string'
          ? JSON.parse(campaign.contentConfig)
          : campaign.contentConfig;

      await this.prisma.surveyAnswer.create({
        data: {
          guestId: guest.id,
          campaignId: campaign.id,
          question: config?.survey?.questionTitle || 'Đánh giá dịch vụ',
          answer: surveyData.answer || '',
          ratingScore: surveyData.ratingScore || null,
        },
      });
    }

    // 5. Ghi nhận Event thống kê
    if (campaign) {
      await this.prisma.campaignEvent.create({
        data: {
          campaignId: campaign.id,
          guestMac: cleanMac,
          eventType: leadData ? 'SUBMIT_LEAD' : 'COMPLETE_AUTH',
          metadata: JSON.stringify({ clientIp, userAgent: 'Mobile Captive Portal' }),
        },
      });
    }

    // 6. Ra lệnh cho thiết bị Router mở Internet qua Gateway Service
    const activeDevice = venue.devices[0];
    const adapter = this.gatewayService.resolveAdapter(activeDevice);

    const gatewayResult = await this.gatewayService.authorize(adapter, {
      clientMac: cleanMac,
      clientIp,
      venueId: venue.id,
      durationMinutes: sessionMinutes,
      downloadSpeedKbps: downloadSpeed,
      uploadSpeedKbps: uploadSpeed,
    });

    return {
      success: gatewayResult.success,
      message: gatewayResult.message || 'Mở mạng thành công',
      expiresAt: gatewayResult.expiresAt,
      redirectUrl: campaign?.redirectUrl || 'https://www.google.com',
      sessionMinutes,
    };
  }

  /**
   * Ghi nhận các sự kiện tương tác (Impression, Click, Skip)
   */
  async trackEvent(campaignId: string, clientMac: string, eventType: string, metadata?: any) {
    return this.prisma.campaignEvent.create({
      data: {
        campaignId,
        guestMac: clientMac.toUpperCase(),
        eventType,
        metadata: metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null,
      },
    });
  }
}
