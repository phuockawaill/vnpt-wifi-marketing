import { DeviceVendor } from '@wifi-marketing/shared';

export interface GatewayAuthParams {
  clientMac: string;
  clientIp?: string;
  venueId: string;
  durationMinutes: number;
  downloadSpeedKbps?: number;
  uploadSpeedKbps?: number;
  extraParams?: Record<string, any>;
}

export interface GatewayAuthResult {
  success: boolean;
  message?: string;
  expiresAt: Date;
  redirectUrl?: string;
  rawResponse?: any;
}

export interface IGatewayAdapter {
  readonly vendor: DeviceVendor;

  /**
   * Cấp quyền truy cập Internet cho MAC của khách
   */
  authorizeGuest(params: GatewayAuthParams): Promise<GatewayAuthResult>;

  /**
   * Thu hồi quyền truy cập / Ngắt kết nối mạng của thiết bị
   */
  revokeGuest(clientMac: string): Promise<boolean>;

  /**
   * Kiểm tra trạng thái kết nối mạng của thiết bị
   */
  getGuestStatus(clientMac: string): Promise<{ isAuthorized: boolean; remainingMinutes?: number }>;

  /**
   * Kiểm tra kết nối tới thiết bị mạng (Ping / Health check API)
   */
  testConnection(): Promise<boolean>;
}
