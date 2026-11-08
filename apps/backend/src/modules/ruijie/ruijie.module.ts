import { Module } from '@nestjs/common';
import { RuijieController } from './ruijie.controller';
import { RuijieService } from './ruijie.service';

@Module({
  controllers: [RuijieController],
  providers: [RuijieService],
  exports: [RuijieService],
})
export class RuijieModule {}
