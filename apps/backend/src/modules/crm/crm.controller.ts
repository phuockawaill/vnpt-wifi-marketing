import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CrmService } from './crm.service';

@ApiTags('Khách Hàng & CRM (Customer CRM Hub)')
@Controller('v1/crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('leads')
  @ApiOperation({ summary: 'Danh bạ khách hàng định danh qua WiFi Marketing' })
  @ApiQuery({ name: 'search', required: false, description: 'Tìm theo Tên, SĐT, Email hoặc MAC' })
  @ApiQuery({ name: 'gender', required: false, description: 'Lọc theo giới tính: male, female, all' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  async getLeads(
    @Query('search') search?: string,
    @Query('gender') gender?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.crmService.getLeads({ search, gender, limit, offset });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Thống kê tổng hợp dữ liệu khách hàng CRM' })
  async getCrmStats() {
    return this.crmService.getCrmStats();
  }

  @Post('send-notification')
  @ApiOperation({ summary: 'Gửi tin nhắn SMS Brandname hoặc Zalo ZNS cho khách hàng' })
  async sendNotification(
    @Body() payload: { guestId: string; channel: 'SMS' | 'ZALO'; message: string },
  ) {
    return this.crmService.sendNotification(payload);
  }
}
