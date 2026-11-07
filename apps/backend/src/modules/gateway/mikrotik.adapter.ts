import { Logger } from '@nestjs/common';
import axios from 'axios';
import { DeviceVendor } from '@wifi-marketing/shared';
import { GatewayAuthParams, GatewayAuthResult, IGatewayAdapter } from './gateway.interface';

export interface MikrotikConfig {
  host: string;
  port?: number; // Default 80 or 443 for REST API v7, or 8728 for Winbox API
  username: string;
  password: string;
  useSsl?: boolean;
}

export class MikrotikAdapter implements IGatewayAdapter {
  readonly vendor: DeviceVendor = DeviceVendor.MIKROTIK;
  private readonly logger = new Logger(MikrotikAdapter.name);

  constructor(private readonly config: MikrotikConfig) {}

  private getBaseUrl(): string {
    const protocol = this.config.useSsl ? 'https' : 'http';
    const port = this.config.port || (this.config.useSsl ? 443 : 80);
    return `${protocol}://${this.config.host}:${port}/rest`;
  }

  private getAuthHeader() {
    const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
    return {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };
  }

  async authorizeGuest(params: GatewayAuthParams): Promise<GatewayAuthResult> {
    const expiresAt = new Date(Date.now() + params.durationMinutes * 60 * 1000);
    const cleanMac = params.clientMac.toUpperCase().replace(/[-:]/g, ':');

    this.logger.log(`[MikroTik] Authorizing MAC ${cleanMac} for ${params.durationMinutes} mins`);

    try {
      // 1. Dùng cơ chế IP-Binding bypass trong RouterOS v7 REST API
      const url = `${this.getBaseUrl()}/ip/hotspot/ip-binding`;
      
      const payload = {
        'mac-address': cleanMac,
        type: 'bypassed',
        comment: `WiFiMarketing_${params.venueId}_Exp_${expiresAt.toISOString()}`,
      };

      const response = await axios.put(url, payload, {
        headers: this.getAuthHeader(),
        timeout: 6000,
      });

      this.logger.log(`[MikroTik] Successfully created IP binding for MAC ${cleanMac}`);

      return {
        success: true,
        message: 'MikroTik Hotspot client authorized successfully',
        expiresAt,
        rawResponse: response.data,
      };
    } catch (error: any) {
      this.logger.error(`[MikroTik] Failed to authorize MAC ${cleanMac}: ${error.message}`);
      
      // Dự phòng: Nếu router chạy RouterOS v6 hoặc không mở REST, ghi nhận log chi tiết
      return {
        success: false,
        message: `MikroTik authorization error: ${error?.response?.data?.message || error.message}`,
        expiresAt,
      };
    }
  }

  async revokeGuest(clientMac: string): Promise<boolean> {
    const cleanMac = clientMac.toUpperCase().replace(/[-:]/g, ':');
    try {
      // Tìm IP binding tương ứng với MAC
      const searchUrl = `${this.getBaseUrl()}/ip/hotspot/ip-binding?mac-address=${encodeURIComponent(cleanMac)}`;
      const getRes = await axios.get(searchUrl, {
        headers: this.getAuthHeader(),
        timeout: 5000,
      });

      if (Array.isArray(getRes.data) && getRes.data.length > 0) {
        const bindingId = getRes.data[0]['.id'];
        await axios.delete(`${this.getBaseUrl()}/ip/hotspot/ip-binding/${bindingId}`, {
          headers: this.getAuthHeader(),
          timeout: 5000,
        });
        this.logger.log(`[MikroTik] Removed binding for MAC ${cleanMac}`);
        return true;
      }
      return false;
    } catch (error: any) {
      this.logger.error(`[MikroTik] Failed to revoke MAC ${cleanMac}: ${error.message}`);
      return false;
    }
  }

  async getGuestStatus(clientMac: string): Promise<{ isAuthorized: boolean; remainingMinutes?: number }> {
    const cleanMac = clientMac.toUpperCase().replace(/[-:]/g, ':');
    try {
      const searchUrl = `${this.getBaseUrl()}/ip/hotspot/ip-binding?mac-address=${encodeURIComponent(cleanMac)}`;
      const res = await axios.get(searchUrl, {
        headers: this.getAuthHeader(),
        timeout: 5000,
      });

      if (Array.isArray(res.data) && res.data.length > 0) {
        return { isAuthorized: true };
      }
      return { isAuthorized: false };
    } catch {
      return { isAuthorized: false };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const res = await axios.get(`${this.getBaseUrl()}/system/resource`, {
        headers: this.getAuthHeader(),
        timeout: 5000,
      });
      return res.status === 200;
    } catch (err: any) {
      this.logger.warn(`[MikroTik] Health check failed: ${err.message}`);
      return false;
    }
  }
}
