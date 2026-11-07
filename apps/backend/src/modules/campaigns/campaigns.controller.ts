import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { CampaignType } from '@wifi-marketing/shared';

@ApiTags('Campaigns')
@Controller('v1/campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  async getAll(@Query('venueId') venueId?: string) {
    return this.campaignsService.findAll(venueId);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  @Post()
  async create(
    @Body()
    body: {
      venueId: string;
      title: string;
      type: CampaignType;
      contentConfig: any;
      sessionMinutes?: number;
      downloadSpeed?: number;
      uploadSpeed?: number;
      redirectUrl?: string;
    },
  ) {
    return this.campaignsService.create(body);
  }

  @Patch(':id/toggle')
  async toggleActive(@Param('id') id: string) {
    return this.campaignsService.toggleActive(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.campaignsService.delete(id);
  }
}
