import { Logger } from '@nestjs/common';
import { DeviceVendor } from '@wifi-marketing/shared';
import { GatewayAuthParams, GatewayAuthResult, IGatewayAdapter } from './gateway.interface';

export class MockAdapter implements IGatewayAdapter {
  readonly vendor: DeviceVendor = DeviceVendor.MOCK;
  private readonly logger = new Logger(MockAdapter.name);
  private authorizedClients = new Map<string, { expiresAt: Date; params: GatewayAuthParams }>();

  async authorizeGuest(params: GatewayAuthParams): Promise<GatewayAuthResult> {
    const cleanMac = params.clientMac.toUpperCase();
    const expiresAt = new Date(Date.now() + params.durationMinutes * 60 * 1000);

    this.authorizedClients.set(cleanMac, {
      expiresAt,
      params,
    });

    this.logger.log(
      `[MOCK GATEWAY] Simulating authorization for MAC: ${cleanMac} at Venue: ${params.venueId} for ${params.durationMinutes} mins (Download: ${params.downloadSpeedKbps || 'unlimited'} Kbps, Upload: ${params.uploadSpeedKbps || 'unlimited'} Kbps)`,
    );

    return {
      success: true,
      message: `[MOCK] Guest ${cleanMac} successfully authorized for ${params.durationMinutes} minutes`,
      expiresAt,
      redirectUrl: 'https://google.com',
    };
  }

  async revokeGuest(clientMac: string): Promise<boolean> {
    const cleanMac = clientMac.toUpperCase();
    const existed = this.authorizedClients.delete(cleanMac);
    this.logger.log(`[MOCK GATEWAY] Revoked MAC: ${cleanMac} (Found: ${existed})`);
    return true;
  }

  async getGuestStatus(clientMac: string): Promise<{ isAuthorized: boolean; remainingMinutes?: number }> {
    const cleanMac = clientMac.toUpperCase();
    const client = this.authorizedClients.get(cleanMac);

    if (!client) {
      return { isAuthorized: false };
    }

    const remainingMinutes = Math.max(0, Math.round((client.expiresAt.getTime() - Date.now()) / 60000));
    return {
      isAuthorized: remainingMinutes > 0,
      remainingMinutes,
    };
  }

  async testConnection(): Promise<boolean> {
    this.logger.log('[MOCK GATEWAY] Health check: OK');
    return true;
  }
}
