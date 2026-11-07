import { Module } from '@nestjs/common';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [GatewayModule],
  controllers: [VenuesController],
  providers: [VenuesService],
  exports: [VenuesService],
})
export class VenuesModule {}
