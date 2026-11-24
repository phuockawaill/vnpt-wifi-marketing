import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { ReportUsage } from './usage/schemas/report.schema';
import { QueryListDTO } from './usage/usage.dto';
import { UsageService } from './usage/usage.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly usageService: UsageService,
  ) {}

  @Post('report-list')
  queryUsage(@Body() params: QueryListDTO) {
    return this.usageService.queryUsage(params);
  }

  @Post('export-report-list')
  exportUsage(@Body() params: QueryListDTO) {
    return this.usageService.exportUsage(params);
  }

  @Post('analytic')
  analyticReport(@Body() params: QueryListDTO) {
    return this.usageService.analyticReport(params);
  }

  @Post('tracking')
  insertTracking(@Body() data: ReportUsage) {
    return this.usageService.insertTracking(data);
  }
}
