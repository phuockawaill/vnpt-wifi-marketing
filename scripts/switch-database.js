const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetMode = (process.argv[2] || 'sqlite').toLowerCase();
const backendDir = path.join(__dirname, '..', 'apps', 'backend');
const envPath = path.join(backendDir, '.env');
const prismaDir = path.join(backendDir, 'prisma');
const schemaTarget = path.join(prismaDir, 'schema.prisma');

console.log(`\n🔄 [DB SWITCHER] Chuyển đổi cấu hình cơ sở dữ liệu sang: ${targetMode.toUpperCase()}`);

if (targetMode === 'sqlite') {
  // 1. Sao chép schema.sqlite.prisma -> schema.prisma
  const sqliteSchema = path.join(prismaDir, 'schema.sqlite.prisma');
  fs.copyFileSync(sqliteSchema, schemaTarget);
  console.log('✅ Đã nạp schema: schema.sqlite.prisma');

  // 2. Cập nhật .env
  const sqliteEnv = `# Chế độ chạy thử nghiệm siêu tốc (Không cần PostgreSQL, không cần Redis, không cần Router thật)
PORT=4000
NODE_ENV=development
DB_TYPE=sqlite
DATABASE_URL="file:./dev.db"

# Redis Cache (false = sử dụng In-Memory Cache)
REDIS_ENABLED=false
REDIS_HOST=localhost
REDIS_PORT=6379

# Mock Gateway (true = giả lập router MikroTik/UniFi/Ruijie)
MOCK_GATEWAY_ENABLED=true

# JWT Secret
JWT_SECRET="super-secret-jwt-key-wifi-marketing-2026"
JWT_EXPIRES_IN="7d"

# Portal Public URL
PORTAL_PUBLIC_URL="http://localhost:3000"
`;

  fs.writeFileSync(envPath, sqliteEnv, 'utf8');
  console.log('✅ Đã cập nhật file .env với SQLite & In-Memory Cache');

  // 3. Chạy prisma db push & seed
  console.log('📦 Đang khởi tạo CSDL SQLite (dev.db)...');
  try {
    execSync('npx prisma db push --schema=prisma/schema.prisma', {
      cwd: backendDir,
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: 'file:./dev.db' },
    });
    console.log('🌱 Đang nạp dữ liệu mẫu vào SQLite...');
    execSync('npx ts-node prisma/seed.sqlite.ts', {
      cwd: backendDir,
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: 'file:./dev.db' },
    });
    console.log('\n🎉 [HOÀN TẤT] Hệ thống đã sẵn sàng 100% ở chế độ SQLite & In-Memory!');
    console.log('👉 Bây giờ bạn có thể khởi động ngay mà không cần cài thêm bất kỳ dịch vụ nào.');
  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo SQLite:', error.message);
  }
} else if (targetMode === 'postgres' || targetMode === 'postgresql') {
  const pgSchema = path.join(prismaDir, 'schema.postgres.prisma');
  fs.copyFileSync(pgSchema, schemaTarget);
  console.log('✅ Đã nạp schema: schema.postgres.prisma');

  const pgEnv = `# Chế độ Production / Doanh nghiệp (PostgreSQL + Redis)
PORT=4000
NODE_ENV=development
DB_TYPE=postgres
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/wifi_marketing?schema=public"

# Redis Cache
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379

# Mock Gateway (false = kết nối Router MikroTik/UniFi/Ruijie thật)
MOCK_GATEWAY_ENABLED=true

# JWT Secret
JWT_SECRET="super-secret-jwt-key-wifi-marketing-2026"
JWT_EXPIRES_IN="7d"

# Portal Public URL
PORTAL_PUBLIC_URL="http://localhost:3000"
`;

  fs.writeFileSync(envPath, pgEnv, 'utf8');
  console.log('✅ Đã cập nhật file .env với PostgreSQL & Redis');

  try {
    execSync('npx prisma generate', { cwd: backendDir, stdio: 'inherit' });
    console.log('\n🎉 [HOÀN TẤT] Đã chuyển sang PostgreSQL! Hãy đảm bảo Docker/Postgres đang chạy.');
  } catch (error) {
    console.error('❌ Lỗi khi nạp cấu hình PostgreSQL:', error.message);
  }
} else {
  console.error('❌ Chế độ không hợp lệ. Vui lòng chọn "sqlite" hoặc "postgres".');
}
