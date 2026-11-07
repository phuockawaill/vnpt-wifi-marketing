import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './modules/cache/cache.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { PortalModule } from './modules/portal/portal.module';
import { VenuesModule } from './modules/venues/venues.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    CacheModule,
    GatewayModule,
    PortalModule,
    VenuesModule,
    CampaignsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
