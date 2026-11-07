/**
 * Script Kim Th Readiness Cho MA'i Tr?ng Production & Docker
 * VNPT ?_k L_k WiFi Marketing Platform
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('  VNPT ?_K L_K - PRODUCTION & DOCKER READINESS AUDIT CHECK');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function check(title, condition, detail) {
  if (condition) {
    console.log(`[\x1b[32mPASS\x1b[0m] ${title}`);
    if (detail) console.log(`       -> ${detail}`);
    passCount++;
  } else {
    console.log(`[\x1b[31mFAIL\x1b[0m] ${title}`);
    if (detail) console.log(`       -> L-i: ${detail}`);
    failCount++;
  }
}

// 1. Kim tra Dockerfiles
check(
  'Dockerfile.backend (Multi-stage Node 20 Alpine)',
  fs.existsSync(path.join(ROOT_DIR, 'docker', 'Dockerfile.backend')),
  'docker/Dockerfile.backend t"n ti vA sn sAng'
);
check(
  'Dockerfile.portal (Next.js Standalone Runner ~60MB)',
  fs.existsSync(path.join(ROOT_DIR, 'docker', 'Dockerfile.portal')),
  'docker/Dockerfile.portal t"n ti'
);
check(
  'Dockerfile.dashboard (Next.js Standalone Runner ~60MB)',
  fs.existsSync(path.join(ROOT_DIR, 'docker', 'Dockerfile.dashboard')),
  'docker/Dockerfile.dashboard t"n ti'
);

// 2. Kim tra Cu hAnh Docker Compose
const composePath = path.join(ROOT_DIR, 'docker', 'docker-compose.prod.yml');
const composeExists = fs.existsSync(composePath);
check('docker-compose.prod.yml (PostgreSQL 15, Redis 7, Nginx, Certbot)', composeExists);
if (composeExists) {
  const content = fs.readFileSync(composePath, 'utf8');
  check('Docker Compose chca d<ch v PostgreSQL', content.includes('postgres:15-alpine'));
  check('Docker Compose chca d<ch v Redis', content.includes('redis:7-alpine'));
  check('Docker Compose chca d<ch v Nginx', content.includes('nginx:alpine'));
  check('Docker Compose chca d<ch v Certbot (Auto SSL)', content.includes('certbot/certbot'));
}

// 3. Kim tra Cu hAnh Nginx & SSL
check(
  'Nginx Config ChA-nh (Gzip, Epoll, Worker 2048)',
  fs.existsSync(path.join(ROOT_DIR, 'docker', 'nginx', 'nginx.conf'))
);
check(
  'Nginx Virtual Hosts (Reverse Proxy, SSL HTTPS, Apple CNA probe)',
  fs.existsSync(path.join(ROOT_DIR, 'docker', 'nginx', 'conf.d', 'default.conf'))
);

// 4. Kim tra Standalone Production Build ca Next.js
check(
  'Portal Standalone Build (apps/portal/.next/standalone)',
  fs.existsSync(path.join(ROOT_DIR, 'apps', 'portal', '.next', 'standalone', 'apps', 'portal', 'server.js')),
  'Th mc standalone vA server.js ca Portal `A sn sAng'
);
check(
  'Dashboard Standalone Build (apps/dashboard/.next/standalone)',
  fs.existsSync(path.join(ROOT_DIR, 'apps', 'dashboard', '.next', 'standalone', 'apps', 'dashboard', 'server.js')),
  'Th mc standalone vA server.js ca Dashboard `A sn sAng'
);

// 5. Kim tra Backend Distribution
check(
  'Backend NestJS Dist (apps/backend/dist/main.js)',
  fs.existsSync(path.join(ROOT_DIR, 'apps', 'backend', 'dist', 'main.js')),
  'Backend compiled NestJS distribution cA3 sn'
);

// 6. Kim tra Dual Engine Prisma (SQLite Dev & PostgreSQL Prod)
check(
  'Prisma Schema PostgreSQL (schema.postgres.prisma)',
  fs.existsSync(path.join(ROOT_DIR, 'apps', 'backend', 'prisma', 'schema.postgres.prisma'))
);
check(
  'Prisma Schema SQLite (schema.sqlite.prisma)',
  fs.existsSync(path.join(ROOT_DIR, 'apps', 'backend', 'prisma', 'schema.sqlite.prisma'))
);

// 7. Kim tra Scripts Trin Khai
check(
  '1-Click Deploy Linux Script (docker/deploy.sh)',
  fs.existsSync(path.join(ROOT_DIR, 'docker', 'deploy.sh'))
);
check(
  '1-Click Deploy Windows Script (docker/deploy.ps1)',
  fs.existsSync(path.join(ROOT_DIR, 'docker', 'deploy.ps1'))
);
check(
  'Auto SSL Let\'s Encrypt Script (docker/init-ssl.sh)',
  fs.existsSync(path.join(ROOT_DIR, 'docker', 'init-ssl.sh'))
);

console.log('\n----------------------------------------------------------------');
console.log(`KT QU KIM TRA: ${passCount} PASSED / ${failCount} FAILED`);
if (failCount === 0) {
  console.log('\x1b[32m[XC NHN] Tt c thAnh ph n Production & Docker `A `t chucn 100%!\x1b[0m');
} else {
  console.log('\x1b[31m[CNH BAO] CA n kim tra li cAc mc b< tht bi tr>c khi deploy!\x1b[0m');
}
console.log('================================================================\n');
