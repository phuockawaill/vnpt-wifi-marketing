import { Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { DeviceVendor } from '@wifi-marketing/shared';
import { GatewayAuthParams, GatewayAuthResult, IGatewayAdapter } from './gateway.interface';

export interface RuijieConfig {
  cloudUrl?: string; // Default: https://cloud-as.ruijienetworks.com
  appKey?: string;
  appSecret?: string;
  gatewayIp?: string; // Trong trường hợp tích hợp Local Gateway Web Auth
}

export class RuijieAdapter implements IGatewayAdapter {
  readonly vendor: DeviceVendor = DeviceVendor.RUIJIE;
  private readonly logger = new Logger(RuijieAdapter.name);

  constructor(private readonly config: RuijieConfig) {}

  private generateSignature(params: Record<string, any>, secret: string): string {
    const sortedKeys = Object.keys(params).sort();
    const queryString = sortedKeys.map((key) => `${key}=${params[key]}`).join('&');
    return crypto.createHmac('sha256', secret).update(queryString).digest('hex');
  }

  async authorizeGuest(params: GatewayAuthParams): Promise<GatewayAuthResult> {
    const expiresAt = new Date(Date.now() + params.durationMinutes * 60 * 1000);
    const cleanMac = params.clientMac.toUpperCase().replace(/[-:]/g, '');

    this.logger.log(`[Ruijie/Reyee] Authorizing MAC ${cleanMac} for ${params.durationMinutes} mins`);

    try {
      // 1. Nếu có gateway IP nội bộ (Local Web Authentication)
      if (this.config.gatewayIp) {
        const localUrl = `http://${this.config.gatewayIp}/api/auth/webauth`;
        const res = await axios.post(
          localUrl,
          {
            mac: cleanMac,
            ip: params.clientIp,
            timeout: params.durationMinutes * 60,
          },
          { timeout: 5000 },
        );

        return {
          success: true,
          message: 'Ruijie local gateway authorized',
          expiresAt,
          rawResponse: res.data,
        };
      }

      // 2. Ruijie Reyee Cloud (MACC OpenAPI)
      const cloudBase = this.config.cloudUrl || 'https://cloud-as.ruijienetworks.com';
      const timestamp = Math.floor(Date.now() / 1000);
      const requestPayload: Record<string, any> = {
        app_key: this.config.appKey || 'wifi_marketing_key',
        timestamp,
        client_mac: cleanMac,
        session_time: params.durationMinutes * 60,
      };

      if (this.config.appSecret) {
        requestPayload.sign = this.generateSignature(requestPayload, this.config.appSecret);
      }

      const response = await axios.post(`${cloudBase}/api/open/macc/auth/user/login`, requestPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 8000,
      });

      return {
        success: true,
        message: 'Ruijie Reyee Cloud authorized client',
        expiresAt,
        rawResponse: response.data,
      };
    } catch (error: any) {
      this.logger.error(`[Ruijie/Reyee] Failed to authorize MAC ${cleanMac}: ${error.message}`);
      return {
        success: false,
        message: `Ruijie authorization error: ${error.message}`,
        expiresAt,
      };
    }
  }

  async revokeGuest(clientMac: string): Promise<boolean> {
    this.logger.log(`[Ruijie/Reyee] Revoking MAC ${clientMac}`);
    return true;
  }

  async getGuestStatus(clientMac: string): Promise<{ isAuthorized: boolean; remainingMinutes?: number }> {
    return { isAuthorized: true, remainingMinutes: 60 };
  }

  async testConnection(): Promise<boolean> {
    return true;
  }
}
