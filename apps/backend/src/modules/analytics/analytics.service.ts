import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverviewStats(venueId?: string) {
    const whereVenue = venueId ? { venueId } : {};

    const [totalVisits, totalLeads, totalImpressions, totalClicks, activeCampaigns] = await Promise.all([
      this.prisma.guestVisit.count({ where: whereVenue }),
      this.prisma.guest.count({ where: { phone: { not: null } } }),
      this.prisma.campaignEvent.count({ where: { eventType: 'IMPRESSION' } }),
      this.prisma.campaignEvent.count({ where: { eventType: 'CLICK' } }),
      this.prisma.campaign.count({ where: { ...whereVenue, isActive: true } }),
    ]);

    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';

    return {
      totalVisits,
      totalLeads,
      totalImpressions,
      totalClicks,
      ctr: `${ctr}%`,
      activeCampaigns,
    };
  }

  async getRecentLeads(limit = 20) {
    return this.prisma.guest.findMany({
      where: { phone: { not: null } },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        visits: {
          take: 1,
          orderBy: { loginAt: 'desc' },
          include: { venue: { select: { name: true } } },
        },
      },
    });
  }
}
