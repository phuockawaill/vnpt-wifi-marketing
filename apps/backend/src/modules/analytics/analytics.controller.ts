import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics & Leads')
@Controller('v1/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  async getOverview(@Query('venueId') venueId?: string) {
    return this.analyticsService.getOverviewStats(venueId);
  }

  @Get('dashboard')
  async getDashboard(@Query('venueId') venueId?: string) {
    return this.analyticsService.getOverviewStats(venueId);
  }

  @Get('leads')
  async getLeads(@Query('limit') limit?: string) {
    return this.analyticsService.getRecentLeads(limit ? parseInt(limit, 10) : 20);
  }
}
