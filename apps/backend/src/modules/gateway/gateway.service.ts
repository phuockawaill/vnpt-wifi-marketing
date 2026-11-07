import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeviceVendor } from '@wifi-marketing/shared';
import { GatewayAuthParams, GatewayAuthResult, IGatewayAdapter } from './gateway.interface';
import { MikrotikAdapter } from './mikrotik.adapter';
import { UnifiAdapter } from './unifi.adapter';
import { RuijieAdapter } from './ruijie.adapter';
import { MockAdapter } from './mock.adapter';

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);
  private readonly mockAdapter = new MockAdapter();

  constructor(private readonly configService: ConfigService) {}

  /**
   * Tạo adapter phù hợp với thiết bị của địa điểm
   */
  resolveAdapter(device?: {
    vendor: DeviceVendor | string;
    ipAddress?: string | null;
    apiPort?: number | null;
    apiUsername?: string | null;
    apiPassword?: string | null;
    siteId?: string | null;
    secretKey?: string | null;
  }): IGatewayAdapter {
    const isMock = this.configService.get<string>('MOCK_GATEWAY_ENABLED') === 'true';

    if (isMock || !device) {
      return this.mockAdapter;
    }

    switch (device.vendor) {
      case DeviceVendor.MIKROTIK:
        return new MikrotikAdapter({
          host: device.ipAddress || '192.168.88.1',
          port: device.apiPort || 80,
          username: device.apiUsername || 'admin',
          password: device.apiPassword || '',
        });

      case DeviceVendor.UNIFI:
        return new UnifiAdapter({
          controllerUrl: `https://${device.ipAddress || '127.0.0.1'}:${device.apiPort || 8443}`,
          siteId: device.siteId || 'default',
          username: device.apiUsername || 'admin',
          password: device.apiPassword || '',
        });

      case DeviceVendor.RUIJIE:
        return new RuijieAdapter({
          cloudUrl: 'https://cloud-as.ruijienetworks.com',
          appKey: device.apiUsername || undefined,
          appSecret: device.secretKey || undefined,
          gatewayIp: device.ipAddress || undefined,
        });

      default:
        this.logger.warn(`Unknown vendor ${device.vendor}, defaulting to MockAdapter`);
        return this.mockAdapter;
    }
  }

  /**
   * Thực hiện cấp quyền mở Internet
   */
  async authorize(adapter: IGatewayAdapter, params: GatewayAuthParams): Promise<GatewayAuthResult> {
    try {
      return await adapter.authorizeGuest(params);
    } catch (error: any) {
      this.logger.error(`Gateway authorization failed: ${error.message}`);
      return {
        success: false,
        message: error.message,
        expiresAt: new Date(),
      };
    }
  }
}
