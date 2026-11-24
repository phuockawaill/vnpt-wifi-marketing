import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  app.setGlobalPrefix('api/v1');

  const configService = app.get(ConfigService);
  const listenPort = configService.get<string>('PORT', '4000');
  await app.listen(listenPort);
  Logger.log(`App running on ${await app.getUrl()}`, 'START');
}
bootstrap();
