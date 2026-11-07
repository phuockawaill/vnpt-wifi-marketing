import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GatewayService } from '../gateway/gateway.service';

@Injectable()
export class VenuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gatewayService: GatewayService,
  ) {}

  async findAll() {
    return this.prisma.venue.findMany({
      include: {
        devices: true,
        _count: {
          select: { campaigns: true, guestVisits: true },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.venue.findUnique({
      where: { id },
      include: {
        devices: true,
        campaigns: true,
      },
    });
  }

  async create(data: { name: string; slug: string; address?: string; phone?: string }) {
    return this.prisma.venue.create({ data });
  }

  async addDevice(
    venueId: string,
    data: {
      vendor: string;
      name: string;
      ipAddress?: string;
      macAddress?: string;
      apiPort?: number;
      apiUsername?: string;
      apiPassword?: string;
      siteId?: string;
      secretKey?: string;
    },
  ) {
    return this.prisma.device.create({
      data: {
        venueId,
        vendor: data.vendor as any,
        name: data.name,
        ipAddress: data.ipAddress,
        macAddress: data.macAddress || `AA:BB:CC:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`,
        apiPort: data.apiPort || (data.vendor === 'UNIFI' ? 8443 : data.vendor === 'MIKROTIK' ? 80 : 443),
        apiUsername: data.apiUsername,
        apiPassword: data.apiPassword,
        siteId: data.siteId || 'default',
        secretKey: data.secretKey,
      },
    });
  }

  async testDevice(deviceId: string) {
    const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) throw new NotFoundException('Device not found');

    const adapter = this.gatewayService.resolveAdapter(device);
    const reachable = await adapter.testConnection();

    // Cập nhật trạng thái
    await this.prisma.device.update({
      where: { id: deviceId },
      data: {
        lastSeenAt: new Date(),
        isActive: reachable,
      },
    });

    return {
      deviceId,
      name: device.name,
      vendor: device.vendor,
      reachable,
      message: reachable ? 'Kết nối tới thiết bị mạng thành công' : 'Không thể kết nối tới thiết bị (Timeout / Sai thông tin)',
    };
  }
}
