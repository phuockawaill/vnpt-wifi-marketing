import { Controller, Get, Post, Body, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PortalService } from './portal.service';
import { AuthorizePortalPayload } from '@wifi-marketing/shared';

@ApiTags('Captive Portal')
@Controller('v1/portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get('init')
  @ApiOperation({ summary: 'Khởi tạo phiên trang chào Captive Portal' })
  async getInit(
    @Query('venue') venueSlug?: string,
    @Query('mac') clientMac?: string,
    @Query('client_mac') ruijieMac?: string,
    @Query('ip') clientIp?: string,
    @Query('client_ip') ruijieIp?: string,
    @Query('gw_id') gwId?: string,
    @Headers('x-forwarded-for') forwardedIp?: string,
  ) {
    const mac = clientMac || ruijieMac;
    const ip = clientIp || ruijieIp || forwardedIp?.split(',')[0] || '192.168.1.100';
    const venue = venueSlug || gwId || 'vnpt-daklak';
    return this.portalService.getPortalContext(venue, mac, ip);
  }

  @Post('authorize')
  @ApiOperation({ summary: 'Gửi kết quả tương tác và yêu cầu mở Internet' })
  async authorize(@Body() payload: AuthorizePortalPayload) {
    return this.portalService.authorizeClient(payload);
  }

  @Post('track')
  @ApiOperation({ summary: 'Ghi nhận sự kiện quảng cáo (Impression, Click...)' })
  async track(
    @Body('campaignId') campaignId: string,
    @Body('clientMac') clientMac: string,
    @Body('eventType') eventType: string,
    @Body('metadata') metadata?: any,
  ) {
    return this.portalService.trackEvent(campaignId, clientMac, eventType, metadata);
  }
}
