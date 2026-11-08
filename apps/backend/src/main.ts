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
    .setTitle('WiFi Marketing Platform API - VNPT Đắk Lắk')
    .setDescription('Core API for Captive Portal, Campaign Management & Ruijie Reyee Cloud Gateway Integrations')
    .setVersion('1.0')
    .addTag('Captive Portal', 'API khởi tạo trang chào và xác thực người dùng WiFi')
    .addTag('Ruijie Cloud & Reyee Integration', 'Chuyên mục cấu hình & các phương thức kết nối Router Ruijie Reyee Cloud')
    .addTag('Campaigns', 'Quản lý chiến dịch quảng cáo và khảo sát người dùng')
    .addTag('Venues', 'Quản lý địa điểm và thiết bị phát sóng WiFi')
    .addTag('Analytics & Leads', 'Thống kê dữ liệu khách hàng và chỉ số tiếp cận')
    .addTag('Health & System', 'Kiểm tra trạng thái máy chủ và kết nối hệ thống')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 WiFi Marketing Backend running at: http://localhost:${port}`);
  logger.log(`📖 Swagger API Docs available at: http://localhost:${port}/docs`);
}
bootstrap();
