import { Module } from '@nestjs/common';
import * as https from 'https';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { RadAcct } from './entities/radacct.entity';
import { ReportUsage, ReportUsageSchema } from './schemas/report.schema';

import {
  SelectOption,
  SelectOptionSchema,
} from './schemas/select-options.schema';

import { UsageController } from './usage.controller';
import { UsageService } from './usage.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      withCredentials: true,
    }),
    MongooseModule.forFeature([
      { name: SelectOption.name, schema: SelectOptionSchema },
      { name: ReportUsage.name, schema: ReportUsageSchema },
    ]),
    TypeOrmModule.forFeature([RadAcct]),
    ConfigModule,
  ],
  controllers: [UsageController],
  providers: [UsageService],
  exports: [UsageService],
})
export class UsageModule {}
