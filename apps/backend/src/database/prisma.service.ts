import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connection established successfully');
    } catch (error: any) {
      this.logger.warn(`⚠️ Database connection deferred/offline: ${error.message}. Running in resilient mode.`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
