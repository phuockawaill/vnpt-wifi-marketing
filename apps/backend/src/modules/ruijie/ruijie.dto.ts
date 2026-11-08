import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class RuijieAuthorizeDto {
  @ApiProperty({
    description: 'Địa chỉ MAC của thiết bị khách (Định dạng bất kỳ: D4:CA:6D:88:99:AA hoặc D4CA6D8899AA)',
    example: 'D4:CA:6D:88:99:AA',
  })
  @IsNotEmpty()
  @IsString()
  clientMac: string;

  @ApiPropertyOptional({
    description: 'Địa chỉ IP của thiết bị khách trong mạng Ruijie',
    example: '10.20.30.150',
  })
  @IsOptional()
  @IsString()
  clientIp?: string;

  @ApiPropertyOptional({
    description: 'Thời gian cấp quyền Internet (phút)',
    example: 180,
    default: 180,
  })
  @IsOptional()
  @IsNumber()
  @Min(5)
  durationMinutes?: number = 180;

  @ApiPropertyOptional({
    description: 'Mã định danh địa điểm hoặc thiết bị Ruijie Gateway',
    example: 'vnpt-daklak-ioc',
  })
  @IsOptional()
  @IsString()
  venueSlug?: string;

  @ApiPropertyOptional({
    description: 'IP nội bộ của Router Ruijie Reyee (nếu dùng chế độ Local WebAuth)',
    example: '192.168.110.1',
  })
  @IsOptional()
  @IsString()
  gatewayIp?: string;
}

export class RuijieRevokeDto {
  @ApiProperty({
    description: 'Địa chỉ MAC cần ngắt kết nối',
    example: 'D4:CA:6D:88:99:AA',
  })
  @IsNotEmpty()
  @IsString()
  clientMac: string;

  @ApiPropertyOptional({
    description: 'IP nội bộ của Router Ruijie Gateway',
    example: '192.168.110.1',
  })
  @IsOptional()
  @IsString()
  gatewayIp?: string;
}

export class RuijieTestConnectionDto {
  @ApiPropertyOptional({
    description: 'URL của Ruijie Cloud (Mặc định: https://cloud-as.ruijienetworks.com)',
    example: 'https://cloud-as.ruijienetworks.com',
  })
  @IsOptional()
  @IsString()
  cloudUrl?: string;

  @ApiPropertyOptional({
    description: 'Ruijie Cloud App Key (OpenAPI)',
    example: 'vnpt_daklak_ruijie_key',
  })
  @IsOptional()
  @IsString()
  appKey?: string;

  @ApiPropertyOptional({
    description: 'Ruijie Cloud App Secret (OpenAPI)',
    example: 'vnpt_daklak_ruijie_secret_2026',
  })
  @IsOptional()
  @IsString()
  appSecret?: string;

  @ApiPropertyOptional({
    description: 'IP nội bộ của Ruijie Router Gateway (nếu test kết nối tại chỗ)',
    example: '192.168.110.1',
  })
  @IsOptional()
  @IsString()
  gatewayIp?: string;
}
