import {
  authSessionSchema,
  magicLinkCallbackRequestSchema,
  requestMagicLinkRequestSchema,
  requestMagicLinkResponseSchema,
  type AuthSession,
  type AuthenticatedUser,
  type MagicLinkCallbackRequest,
  type RequestMagicLinkRequest,
  type RequestMagicLinkResponse,
} from '@lume/protocol';
import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * Request a magic-link email. The response is intentionally constant
   * so an attacker cannot probe which emails are registered.
   */
  @Post('magic-link')
  @HttpCode(HttpStatus.OK)
  async requestMagicLink(
    @Body(new ZodValidationPipe(requestMagicLinkRequestSchema))
    body: RequestMagicLinkRequest,
  ): Promise<RequestMagicLinkResponse> {
    await this.auth.requestMagicLink(body);
    return requestMagicLinkResponseSchema.parse({ ok: true, emailSent: true });
  }

  /**
   * Exchange a magic-link token for an authenticated session.
   */
  @Post('magic-link/callback')
  @HttpCode(HttpStatus.OK)
  async magicLinkCallback(
    @Body(new ZodValidationPipe(magicLinkCallbackRequestSchema))
    body: MagicLinkCallbackRequest,
  ): Promise<AuthSession> {
    const session = await this.auth.completeMagicLink(body.token);
    return authSessionSchema.parse(session);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
