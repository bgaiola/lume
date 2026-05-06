import {
  desktopNotifyRequestSchema,
  desktopNotifyResponseSchema,
  desktopPlatformSchema,
  type DesktopNotifyRequest,
  type DesktopNotifyResponse,
  type DesktopPlatform,
} from '@lume/protocol';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { type Response } from 'express';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

import { DownloadsService } from './downloads.service';

@Controller('downloads')
export class DownloadsController {
  constructor(private readonly downloads: DownloadsService) {}

  /**
   * Stream the desktop bundle for the requested platform. Browsers
   * receive `Content-Disposition: attachment` so the file downloads
   * instead of opening in-page.
   */
  @Get('desktop/:platform')
  desktop(
    @Param('platform', new ZodValidationPipe(desktopPlatformSchema))
    platform: DesktopPlatform,
    @Res() res: Response,
  ): void {
    const binary = this.downloads.getBinary(platform);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', binary.size);
    res.setHeader('Content-Disposition', `attachment; filename="${binary.filename}"`);
    binary.stream.pipe(res);
  }

  /**
   * Capture an email address for a platform that is not yet shipping.
   * Stored as JSONL on the API host for now; we replay it once the
   * build is published.
   */
  @Post('notify')
  @HttpCode(HttpStatus.OK)
  async notify(
    @Body(new ZodValidationPipe(desktopNotifyRequestSchema))
    body: DesktopNotifyRequest,
  ): Promise<DesktopNotifyResponse> {
    await this.downloads.addToWaitlist(body.email, body.platform);
    return desktopNotifyResponseSchema.parse({ ok: true });
  }
}
