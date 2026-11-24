import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface VoucherItem {
  id: string;
  code: string;
  minutes: number;
  speedMbps: number;
  maxUses: number;
  usedCount: number;
  status: 'active' | 'used' | 'expired';
  claimedByMac?: string;
  createdAt: string;
}

@Injectable()
export class VouchersService {
  private readonly logger = new Logger(VouchersService.name);

  // In-memory persistent cache for quick response
  private vouchers: VoucherItem[] = [
    {
      id: 'v-01',
      code: 'VNPT_BMT_2026',
      minutes: 240,
      speedMbps: 50,
      maxUses: 100,
      usedCount: 24,
      status: 'active',
      createdAt: '2026-11-20',
    },
    {
      id: 'v-02',
      code: 'COFFEE_FESTIVAL',
      minutes: 180,
      speedMbps: 30,
      maxUses: 500,
      usedCount: 142,
      status: 'active',
      createdAt: '2026-11-21',
    },
    {
      id: 'v-03',
      code: 'IOC_VIP_GUEST',
      minutes: 480,
      speedMbps: 100,
      maxUses: 10,
      usedCount: 10,
      status: 'used',
      createdAt: '2026-11-22',
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async listVouchers(): Promise<VoucherItem[]> {
    return this.vouchers;
  }

  async createVoucher(dto: {
    code?: string;
    minutes?: number;
    speedMbps?: number;
    maxUses?: number;
  }): Promise<VoucherItem> {
    const code =
      dto.code?.trim().toUpperCase() ||
      `VNPT_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newVoucher: VoucherItem = {
      id: `v-${Date.now()}`,
      code,
      minutes: Number(dto.minutes) || 180,
      speedMbps: Number(dto.speedMbps) || 30,
      maxUses: Number(dto.maxUses) || 1,
      usedCount: 0,
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
    };

    this.vouchers.unshift(newVoucher);
    this.logger.log(`Created new Voucher code: ${newVoucher.code} (${newVoucher.minutes} mins)`);
    return newVoucher;
  }

  async validateAndClaim(code: string, clientMac: string): Promise<{ valid: boolean; message: string; voucher?: VoucherItem }> {
    const cleanCode = code.trim().toUpperCase();
    const found = this.vouchers.find((v) => v.code === cleanCode);

    if (!found) {
      return { valid: false, message: 'Mã voucher không tồn tại trên hệ thống VNPT Đắk Lắk!' };
    }

    if (found.status === 'expired' || found.usedCount >= found.maxUses) {
      return { valid: false, message: 'Mã voucher đã hết lượt sử dụng hoặc hết hạn!' };
    }

    found.usedCount += 1;
    found.claimedByMac = clientMac;
    if (found.usedCount >= found.maxUses) {
      found.status = 'used';
    }

    this.logger.log(`Voucher ${found.code} claimed by MAC: ${clientMac}`);
    return {
      valid: true,
      message: `Kích hoạt mã voucher thành công! Bạn nhận được ${found.minutes} phút truy cập tốc độ ${found.speedMbps} Mbps.`,
      voucher: found,
    };
  }
}
