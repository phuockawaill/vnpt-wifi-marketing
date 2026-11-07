import { Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as https from 'https';
import { DeviceVendor } from '@wifi-marketing/shared';
import { GatewayAuthParams, GatewayAuthResult, IGatewayAdapter } from './gateway.interface';

export interface UnifiConfig {
  controllerUrl: string; // e.g. https://192.168.1.50:8443
  siteId?: string; // Default 'default'
  username: string;
  password: string;
}

export class UnifiAdapter implements IGatewayAdapter {
  readonly vendor: DeviceVendor = DeviceVendor.UNIFI;
  private readonly logger = new Logger(UnifiAdapter.name);
  private httpClient: AxiosInstance;
  private sessionCookie: string | null = null;

  constructor(private readonly config: UnifiConfig) {
    this.httpClient = axios.create({
      baseURL: config.controllerUrl.replace(/\/$/, ''),
      httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Hầu hết UniFi controller dùng self-signed cert
      timeout: 8000,
      withCredentials: true,
    });
  }

  private async login(): Promise<boolean> {
    try {
      const response = await this.httpClient.post('/api/login', {
        username: this.config.username,
        password: this.config.password,
      });

      const setCookie = response.headers['set-cookie'];
      if (setCookie && setCookie.length > 0) {
        this.sessionCookie = setCookie.join('; ');
        this.logger.log('[UniFi] Logged in successfully to Controller');
        return true;
      }
      return false;
    } catch (error: any) {
      this.logger.error(`[UniFi] Login error: ${error.message}`);
      return false;
    }
  }

  async authorizeGuest(params: GatewayAuthParams): Promise<GatewayAuthResult> {
    const expiresAt = new Date(Date.now() + params.durationMinutes * 60 * 1000);
    const cleanMac = params.clientMac.toLowerCase();
    const site = this.config.siteId || 'default';

    this.logger.log(`[UniFi] Authorizing MAC ${cleanMac} on site ${site} for ${params.durationMinutes} mins`);

    try {
      if (!this.sessionCookie) {
        const loggedIn = await this.login();
        if (!loggedIn) {
          throw new Error('Could not establish session with UniFi Controller');
        }
      }

      const payload: Record<string, any> = {
        cmd: 'authorize-guest',
        mac: cleanMac,
        minutes: params.durationMinutes,
      };

      if (params.uploadSpeedKbps) {
        payload.up = params.uploadSpeedKbps;
      }
      if (params.downloadSpeedKbps) {
        payload.down = params.downloadSpeedKbps;
      }

      const response = await this.httpClient.post(`/api/s/${site}/cmd/stamgr`, payload, {
        headers: {
          Cookie: this.sessionCookie,
        },
      });

      this.logger.log(`[UniFi] Authorize response: ${JSON.stringify(response.data)}`);

      return {
        success: true,
        message: 'UniFi client authorized successfully',
        expiresAt,
        rawResponse: response.data,
      };
    } catch (error: any) {
      this.logger.error(`[UniFi] Failed to authorize MAC ${cleanMac}: ${error.message}`);
      return {
        success: false,
        message: `UniFi authorization error: ${error.message}`,
        expiresAt,
      };
    }
  }

  async revokeGuest(clientMac: string): Promise<boolean> {
    const cleanMac = clientMac.toLowerCase();
    const site = this.config.siteId || 'default';

    try {
      if (!this.sessionCookie) {
        await this.login();
      }

      await this.httpClient.post(
        `/api/s/${site}/cmd/stamgr`,
        {
          cmd: 'unauthorize-guest',
          mac: cleanMac,
        },
        {
          headers: { Cookie: this.sessionCookie },
        },
      );
      return true;
    } catch (error: any) {
      this.logger.error(`[UniFi] Failed to revoke MAC ${cleanMac}: ${error.message}`);
      return false;
    }
  }

  async getGuestStatus(clientMac: string): Promise<{ isAuthorized: boolean; remainingMinutes?: number }> {
    const cleanMac = clientMac.toLowerCase();
    const site = this.config.siteId || 'default';

    try {
      if (!this.sessionCookie) {
        await this.login();
      }

      const res = await this.httpClient.get(`/api/s/${site}/stat/guest`, {
        headers: { Cookie: this.sessionCookie },
      });

      const guest = res.data?.data?.find((g: any) => g.mac === cleanMac);
      if (guest && guest.end) {
        const remainingMinutes = Math.max(0, Math.round((guest.end * 1000 - Date.now()) / 60000));
        return { isAuthorized: remainingMinutes > 0, remainingMinutes };
      }
      return { isAuthorized: false };
    } catch {
      return { isAuthorized: false };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      return await this.login();
    } catch {
      return false;
    }
  }
}
