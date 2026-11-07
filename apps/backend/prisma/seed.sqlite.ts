import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 [SQLite] Seeding VNPT Đắk Lắk AI WiFi Marketing data...');

  // 1. Tạo Venue VNPT Đắk Lắk
  const vnptDakLak = await prisma.venue.upsert({
    where: { slug: 'vnpt-daklak' },
    update: {
      name: 'VNPT Đắk Lắk - Trung Tâm Điều Hành Đô Thị Thông Minh (IOC Đắk Lắk)',
      address: 'Số 06 Lê Duẩn, Phường Tân Thành, TP. Buôn Ma Thuột, Tỉnh Đắk Lắk',
      phone: '0262 3855 855',
      brandColor: '#005BAC',
      logoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&auto=format&fit=crop&q=80',
    },
    create: {
      name: 'VNPT Đắk Lắk - Trung Tâm Điều Hành Đô Thị Thông Minh (IOC Đắk Lắk)',
      slug: 'vnpt-daklak',
      address: 'Số 06 Lê Duẩn, Phường Tân Thành, TP. Buôn Ma Thuột, Tỉnh Đắk Lắk',
      phone: '0262 3855 855',
      brandColor: '#005BAC',
      logoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&auto=format&fit=crop&q=80',
    },
  });

  console.log(`✅ [VNPT Đắk Lắk] Created Venue: ${vnptDakLak.name} (${vnptDakLak.id})`);

  // 2. Tạo thiết bị mạng VNPT iGate & Gateways tại Đắk Lắk
  await prisma.device.upsert({
    where: { macAddress: 'A0:B1:C2:01:02:03' },
    update: {},
    create: {
      venueId: vnptDakLak.id,
      vendor: 'VNPT_IGATE',
      name: 'Modem GPON VNPT iGate GW040-H (Trạm Viễn thông Buôn Ma Thuột)',
      ipAddress: '192.168.1.1',
      macAddress: 'A0:B1:C2:01:02:03',
      apiPort: 80,
      apiUsername: 'admin',
      apiPassword: 'adminpassword',
      isActive: true,
    },
  });

  await prisma.device.upsert({
    where: { macAddress: 'D4:CA:6D:11:22:33' },
    update: {},
    create: {
      venueId: vnptDakLak.id,
      vendor: 'MIKROTIK',
      name: 'Router Gateway MikroTik RB750Gr3 (Cụm Quảng Trường 10/3 Buôn Ma Thuột)',
      ipAddress: '192.168.88.1',
      macAddress: 'D4:CA:6D:11:22:33',
      apiPort: 80,
      apiUsername: 'admin',
      apiPassword: 'adminpassword',
      isActive: true,
    },
  });

  await prisma.device.upsert({
    where: { macAddress: '74:83:C2:AA:BB:CC' },
    update: {},
    create: {
      venueId: vnptDakLak.id,
      vendor: 'UNIFI',
      name: 'UniFi AP U6-Pro (Trung Tâm Hành Chính Công Tỉnh Đắk Lắk)',
      ipAddress: '192.168.1.50',
      macAddress: '74:83:C2:AA:BB:CC',
      apiPort: 8443,
      apiUsername: 'unifi_admin',
      apiPassword: 'unifipassword',
      siteId: 'default',
      isActive: true,
    },
  });

  await prisma.device.upsert({
    where: { macAddress: '00:00:00:00:00:00' },
    update: {},
    create: {
      venueId: vnptDakLak.id,
      vendor: 'MOCK',
      name: 'VNPT AI Gateway Simulator (Cụm Du Lịch Làng Cà Phê)',
      ipAddress: '127.0.0.1',
      macAddress: '00:00:00:00:00:00',
      isActive: true,
    },
  });

  // 3. Tạo Chiến Dịch Quảng Bá Chuyển Đổi Số VNPT Đắk Lắk
  const existingCampaign = await prisma.campaign.findFirst({
    where: { venueId: vnptDakLak.id },
  });

  if (!existingCampaign) {
    await prisma.campaign.create({
      data: {
        venueId: vnptDakLak.id,
        title: 'VNPT Đắk Lắk - Chào Mừng Đến Với Thủ Phủ Cà Phê Buôn Ma Thuột',
        type: 'LEAD_FORM',
        sessionMinutes: 180, // 3 tiếng
        downloadSpeed: 30720, // 30 Mbps
        uploadSpeed: 15360, // 15 Mbps
        redirectUrl: 'https://daklak.vnpt.vn',
        contentConfig: JSON.stringify({
          banner: {
            bannerImageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1000&auto=format&fit=crop&q=80',
            countdownSeconds: 5,
          },
          leadForm: {
            requireFullName: true,
            requirePhone: true,
            requireEmail: false,
            requireGender: true,
          },
          survey: {
            questionTitle: 'Quý khách đánh giá thế nào về chất lượng hạ tầng số VNPT Đắk Lắk?',
            surveyType: 'RATING_STAR',
            ratingScale: 5,
          },
        }),
      },
    });
    console.log('✅ [VNPT Đắk Lắk] Created Demo Campaign: Cà phê Buôn Ma Thuột & Chuyển đổi số');
  }

  console.log('🚀 [VNPT Đắk Lắk] Seeding complete! Database ready at dev.db');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
