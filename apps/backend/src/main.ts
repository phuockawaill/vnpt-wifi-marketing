import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('WiFi Marketing Platform API')
    .setDescription('Core API for Captive Portal, Campaign Management & Gateway Integrations')
    .setVersion('1.0')
    .addTag('Captive Portal')
    .addTag('Campaigns')
    .addTag('Venues')
    .addTag('Analytics & Leads')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 WiFi Marketing Backend running at: http://localhost:${port}`);
  logger.log(`📖 Swagger API Docs available at: http://localhost:${port}/docs`);
}
bootstrap();
