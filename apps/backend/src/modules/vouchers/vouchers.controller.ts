import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VouchersService } from './vouchers.service';

@ApiTags('Quản Lý Vouchers & Băng Thông (Vouchers Hub)')
@Controller('v1/vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách mã voucher phát hành' })
  async listVouchers() {
    return this.vouchersService.listVouchers();
  }

  @Post('create')
  @ApiOperation({ summary: 'Sinh mã voucher mới' })
  async createVoucher(
    @Body() dto: { code?: string; minutes?: number; speedMbps?: number; maxUses?: number },
  ) {
    return this.vouchersService.createVoucher(dto);
  }

  @Post('claim')
  @ApiOperation({ summary: 'Khai báo và kích hoạt mã voucher từ Captive Portal' })
  async claimVoucher(@Body() payload: { code: string; clientMac: string }) {
    return this.vouchersService.validateAndClaim(payload.code, payload.clientMac);
  }
}
