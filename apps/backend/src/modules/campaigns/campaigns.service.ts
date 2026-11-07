import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CampaignType } from '@wifi-marketing/shared';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(venueId?: string) {
    return this.prisma.campaign.findMany({
      where: venueId ? { venueId } : undefined,
      include: {
        venue: { select: { id: true, name: true } },
        _count: { select: { events: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.campaign.findUnique({
      where: { id },
      include: { venue: true },
    });
  }

  async create(data: {
    venueId: string;
    title: string;
    type: CampaignType;
    contentConfig: any;
    sessionMinutes?: number;
    downloadSpeed?: number;
    uploadSpeed?: number;
    redirectUrl?: string;
  }) {
    return this.prisma.campaign.create({
      data: {
        venueId: data.venueId,
        title: data.title,
        type: data.type,
        contentConfig:
          typeof data.contentConfig === 'string'
            ? data.contentConfig
            : JSON.stringify(data.contentConfig),
        sessionMinutes: data.sessionMinutes || 60,
        downloadSpeed: data.downloadSpeed,
        uploadSpeed: data.uploadSpeed,
        redirectUrl: data.redirectUrl,
      },
    });
  }

  async toggleActive(id: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new Error('Campaign not found');
    return this.prisma.campaign.update({
      where: { id },
      data: { isActive: !campaign.isActive },
    });
  }

  async delete(id: string) {
    return this.prisma.campaign.delete({ where: { id } });
  }
}
