import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health & System')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'System Health Check & Welcome' })
  getRoot() {
    return {
      service: 'Hệ Thống WiFi Marketing Chuyển Đổi Số - VNPT Đắk Lắk',
      status: 'online',
      version: '1.0.0',
      swaggerDocs: '/docs',
      timestamp: new Date().toISOString(),
    };
  }
}
