import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Genex WiFi Legacy Compatibility')
@Controller('api/common')
export class LegacyController {
  @Get(':locationId/captiveRuijie/ping')
  @ApiOperation({ summary: 'Genex Ruijie Heartbeat Ping' })
  pingRuijie(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/plain');
    return res.send('Pong');
  }

  @Get(':locationId/captiveRuijie/login')
  @ApiOperation({ summary: 'Genex Ruijie Captive Portal Direct Route' })
  ruijieLogin(
    @Param('locationId') locationId: string,
    @Query('gw_address') gwAddress: string,
    @Query('gw_port') gwPort: string,
    @Query('gw_id') gwId: string,
    @Query('mac') mac: string,
    @Query('ip') ip: string,
    @Res() res: Response,
  ) {
    // Redirect cleanly to the modernized Next.js portal with all params preserved
    const params = new URLSearchParams({
      venue: locationId || gwId || 'vnpt-daklak',
      mac: mac || '',
      ip: ip || '',
      gw_address: gwAddress || '',
      gw_port: gwPort || '2060',
      gw_id: gwId || '1',
    });
    return res.redirect(`/login?${params.toString()}`);
  }

  @Get(':locationId/externalType/:type')
  @ApiOperation({ summary: 'Genex Multi-Vendor External Route' })
  externalType(
    @Param('locationId') locationId: string,
    @Param('type') type: string,
    @Query() query: any,
    @Res() res: Response,
  ) {
    const params = new URLSearchParams(query);
    params.set('venue', locationId);
    params.set('vendor', type);
    return res.redirect(`/login?${params.toString()}`);
  }
}
