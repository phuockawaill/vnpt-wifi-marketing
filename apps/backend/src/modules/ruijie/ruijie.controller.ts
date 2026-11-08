import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RuijieService } from './ruijie.service';
import { RuijieAuthorizeDto, RuijieRevokeDto, RuijieTestConnectionDto } from './ruijie.dto';

@ApiTags('Ruijie Cloud & Reyee Integration')
@Controller('v1/ruijie')
export class RuijieController {
  constructor(private readonly ruijieService: RuijieService) {}

  @Get('overview')
  @ApiOperation({
    summary: '1. Tổng quan giải pháp WiFi Marketing VNPT Đắk Lắk trên Ruijie Reyee Cloud',
    description: 'Trả về thông tin kiến trúc, tính năng và danh sách thiết bị Ruijie Reyee được hỗ trợ.',
  })
  getOverview() {
    return this.ruijieService.getOverview();
  }

  @Get('config-guide')
  @ApiOperation({
    summary: '2. Hướng dẫn cấu hình từng bước (Step-by-Step) trên Ruijie Reyee Cloud',
    description:
      'Cung cấp thông tin chi tiết từng bước: Auth Mode, URL Portal Server, danh sách tên miền Whitelist (Walled Garden) bắt buộc.',
  })
  getConfigGuide() {
    return this.ruijieService.getConfigGuide();
  }

  @Get('connection-modes')
  @ApiOperation({
    summary: '3. Danh sách & Phân tích 4 phương thức kết nối Ruijie Reyee',
    description:
      'Chi tiết 4 phương thức: 1. External Portal Redirection, 2. Ruijie Cloud MACC OpenAPI, 3. Local Gateway WebAuth API, 4. External RADIUS (AAA).',
  })
  getConnectionModes() {
    return this.ruijieService.getConnectionModes();
  }

  @Get('portal-url')
  @ApiOperation({
    summary: '4. Sinh đường dẫn Captive Portal chuẩn hóa cho Ruijie Reyee',
    description: 'Sinh URL tích hợp kèm các tham số của Router Ruijie (venue, client_mac, client_ip, ssid, gw_id).',
  })
  @ApiQuery({ name: 'venueSlug', required: false, example: 'vnpt-daklak', description: 'Mã địa điểm VNPT Đắk Lắk' })
  @ApiQuery({ name: 'clientMac', required: false, example: 'D4:CA:6D:88:99:AA', description: 'Địa chỉ MAC khách hàng' })
  @ApiQuery({ name: 'clientIp', required: false, example: '10.20.30.150', description: 'IP khách hàng trong mạng WiFi' })
  @ApiQuery({ name: 'ssid', required: false, example: 'VNPT DAK LAK - SMART WIFI', description: 'Tên sóng WiFi' })
  @ApiQuery({ name: 'gwId', required: false, example: 'GW-RUIJIE-01', description: 'ID thiết bị Router Gateway' })
  getPortalUrl(
    @Query('venueSlug') venueSlug?: string,
    @Query('clientMac') clientMac?: string,
    @Query('clientIp') clientIp?: string,
    @Query('ssid') ssid?: string,
    @Query('gwId') gwId?: string,
  ) {
    return this.ruijieService.generatePortalUrl({
      venueSlug,
      clientMac,
      clientIp,
      ssid,
      gwId,
    });
  }

  @Post('test-connection')
  @ApiOperation({
    summary: '5. Kiểm tra kết nối tới Ruijie Cloud hoặc Router Gateway tại chỗ',
    description: 'Kiểm tra độ trễ mạng, tính khả dụng của cụm máy chủ Ruijie Cloud (Singapore) hoặc IP Router tại chỗ.',
  })
  testConnection(@Body() dto: RuijieTestConnectionDto) {
    return this.ruijieService.testConnection(dto);
  }

  @Post('authorize')
  @ApiOperation({
    summary: '6. Cấp quyền truy cập Internet (Authorize) cho thiết bị qua Ruijie',
    description: 'Gửi lệnh mở mạng cho địa chỉ MAC khách hàng với thời gian sử dụng cụ thể.',
  })
  authorizeClient(@Body() dto: RuijieAuthorizeDto) {
    return this.ruijieService.authorize(dto);
  }

  @Post('revoke')
  @ApiOperation({
    summary: '7. Ngắt quyền truy cập Internet (Revoke / Kick MAC)',
    description: 'Ngắt kết nối của thiết bị khách khỏi mạng WiFi khi hết hạn hoặc bị vi phạm.',
  })
  revokeClient(@Body() dto: RuijieRevokeDto) {
    return this.ruijieService.revoke(dto);
  }
}
