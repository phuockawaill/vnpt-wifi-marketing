import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, DeviceVendor, CampaignType } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connection established successfully');

      // Tự động khởi tạo dữ liệu nền tảng VNPT Đắk Lắk nếu cơ sở dữ liệu trống
      await this.seedInitialDataIfEmpty();
    } catch (error: any) {
      this.logger.warn(`⚠️ Database connection deferred/offline: ${error.message}. Running in resilient mode.`);
    }
  }

  async seedInitialDataIfEmpty() {
    try {
      const venueCount = await this.venue.count();
      if (venueCount === 0) {
        this.logger.log('🌱 [Auto-Seed] CSDL trống, đang tự động nạp dữ liệu nền tảng VNPT Đắk Lắk...');

        const vnptDakLak = await this.venue.create({
          data: {
            name: 'VNPT Đắk Lắk - Trung Tâm Điều Hành Đô Thị Thông Minh (IOC Đắk Lắk)',
            slug: 'vnpt-daklak',
            address: 'Số 06 Lê Duẩn, Phường Tân Thành, TP. Buôn Ma Thuột, Tỉnh Đắk Lắk',
            phone: '0262 3855 855',
            brandColor: '#005BAC',
            logoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300',
          },
        });

        // Thiết bị Router Ruijie Reyee
        await this.device.create({
          data: {
            venueId: vnptDakLak.id,
            vendor: DeviceVendor.RUIJIE,
            name: 'Router Ruijie Reyee RG-EG105G-V2 (Cụm IOC Đắk Lắk)',
            ipAddress: '192.168.110.1',
            macAddress: 'D4:CA:6D:88:99:AA',
            isActive: true,
          },
        });

        // Chiến dịch mặc định đang HOẠT ĐỘNG
        await this.campaign.create({
          data: {
            venueId: vnptDakLak.id,
            title: 'VNPT Đắk Lắk - Chào Mừng Đến Với Thủ Phủ Cà Phê Buôn Ma Thuột',
            type: CampaignType.LEAD_FORM,
            sessionMinutes: 180,
            downloadSpeed: 30720,
            uploadSpeed: 15360,
            redirectUrl: 'https://daklak.vnpt.vn',
            priority: 10,
            isActive: true,
            contentConfig: JSON.stringify({
              banner: {
                bannerImageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1000',
                countdownSeconds: 5,
              },
              leadForm: {
                requireFullName: true,
                requirePhone: true,
                requireGender: true,
              },
              survey: {
                questionTitle: 'Quý khách đánh giá thế nào về chất lượng hạ tầng số VNPT Đắk Lắk?',
                ratingScale: 5,
              },
            }),
          },
        });

        this.logger.log('🎉 [Auto-Seed] Đã tạo thành công Venue, Router Ruijie & Chiến dịch số VNPT Đắk Lắk!');
      }
    } catch (seedErr: any) {
      this.logger.warn(`[Auto-Seed] Bỏ qua nạp dữ liệu: ${seedErr.message}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
