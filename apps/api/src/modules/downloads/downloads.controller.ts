import {
  desktopNotifyRequestSchema,
  desktopNotifyResponseSchema,
  desktopPlatformSchema,
  type DesktopNotifyRequest,
  type DesktopNotifyResponse,
  type DesktopPlatform,
} from '@lume/protocol';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { type Response } from 'express';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

import { DownloadsService } from './downloads.service';

@Controller('downloads')
export class DownloadsController {
  constructor(private readonly downloads: DownloadsService) {}

  /**
   * Stream the desktop bundle for the requested platform. Falls back
   * to a 302 redirect to the GitHub Release asset when no local mirror
   * is staged. The same URL is therefore stable both before and after
   * the bundle pipeline mirrors the binary into apps/api/public.
   */
  @Get('desktop/:platform')
  desktop(
    @Param('platform', new ZodValidationPipe(desktopPlatformSchema))
    platform: DesktopPlatform,
    @Res() res: Response,
  ): void {
    const resolution = this.downloads.resolve(platform);

    if (resolution.kind === 'redirect') {
      res.redirect(HttpStatus.FOUND, resolution.url);
      return;
    }

    if (resolution.kind === 'unavailable') {
      throw new NotFoundException({
        code: 'DOWNLOAD_NOT_AVAILABLE',
        message: `No published build for ${platform} yet.`,
      });
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', resolution.size);
    res.setHeader('Content-Disposition', `attachment; filename="${resolution.filename}"`);
    resolution.stream.pipe(res);
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
