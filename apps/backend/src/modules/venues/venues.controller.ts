import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VenuesService } from './venues.service';

@ApiTags('Venues & Devices')
@Controller('v1/venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get()
  async getAll() {
    return this.venuesService.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.venuesService.findOne(id);
  }

  @Post()
  async create(@Body() body: { name: string; slug: string; address?: string; phone?: string }) {
    return this.venuesService.create(body);
  }

  @Post(':id/devices')
  @ApiOperation({ summary: 'Thêm Router/AP mới cho địa điểm' })
  async addDevice(
    @Param('id') venueId: string,
    @Body()
    body: {
      vendor: string;
      name: string;
      ipAddress?: string;
      macAddress?: string;
      apiPort?: number;
      apiUsername?: string;
      apiPassword?: string;
      siteId?: string;
      secretKey?: string;
    },
  ) {
    return this.venuesService.addDevice(venueId, body);
  }

  @Post('devices/:deviceId/test-connection')
  @ApiOperation({ summary: 'Kiểm tra kết nối trực tiếp tới Router/AP' })
  async testConnection(@Param('deviceId') deviceId: string) {
    return this.venuesService.testDevice(deviceId);
  }
}
