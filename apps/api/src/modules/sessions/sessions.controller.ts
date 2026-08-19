import {
  createSessionRequestSchema,
  joinSessionRequestSchema,
  listSessionsQuerySchema,
  cuidSchema,
  sessionCodeSchema,
  type AuthenticatedUser,
  type CreateSessionRequest,
  type CreateSessionResponse,
  type JoinSessionRequest,
  type JoinSessionResponse,
  type ListSessionsQuery,
  type ListSessionsResponse,
  type Session,
  type SessionInfoResponse,
} from '@lume/protocol';
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';

import { type AppConfig } from '../../common/config/app.config';
import { timingSafeEqualString } from '../../common/crypto/timing-safe-equal';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessions: SessionsService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  /* ------------------------ Authenticated endpoints ----------------------- */

  @Post()
  @UseGuards(AuthGuard)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createSessionRequestSchema))
    body: CreateSessionRequest,
  ): Promise<CreateSessionResponse> {
    return this.sessions.create(user.id, user.organizationId, body);
  }

  @Get()
  @UseGuards(AuthGuard)
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listSessionsQuerySchema)) query: ListSessionsQuery,
  ): Promise<ListSessionsResponse> {
    return this.sessions.list(user.organizationId, user.id, query);
  }

  /**
   * End a session the technician owns. Until this existed there was no way to
   * close a session at all: the code stayed valid and the room stayed open.
   */
  @Post(':id/end')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async end(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ session: Session }> {
    const session = await this.sessions.endAsHost(id, user.id, user.organizationId);
    return { session };
  }

  /**
   * Re-mint the signaling credential for a session already owned by the
   * caller, so a dropped panel can rejoin without creating a new code the
   * customer would have to be sent again.
   */
  @Post(':id/host-token')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async hostToken(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') idOrCode: string,
  ): Promise<{
    hostToken: string;
    hostTokenExpiresAt: string;
    iceServers: JoinSessionResponse['iceServers'];
    signalingUrl: string;
  }> {
    const { token, expiresAt, iceServers } = await this.sessions.refreshHostToken(
      idOrCode,
      user.id,
      user.organizationId,
    );
    return {
      hostToken: token,
      hostTokenExpiresAt: expiresAt.toISOString(),
      iceServers,
      signalingUrl: this.config.get('lumeSignalingPublicUrl', { infer: true }),
    };
  }

  /* ---------------------------- Internal ---------------------------------- */

  /**
   * Called by the signaling service when a room empties, so the session is
   * closed the moment the call ends rather than lingering until the sweep.
   *
   * Authenticated with a shared secret rather than a user token: the caller is
   * a service, not a person. Compared in constant time so the secret cannot be
   * recovered by timing the responses.
   */
  @Post('internal/ended')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ short: { ttl: 1_000, limit: 50 }, medium: { ttl: 60_000, limit: 600 } })
  async internalEnded(
    @Headers('x-lume-signaling-secret') secret: string | undefined,
    @Body() body: { sessionId?: string },
  ): Promise<void> {
    const expected = this.config.get('signalingWebhookSecret', { infer: true });
    if (!secret || !timingSafeEqualString(secret, expected)) {
      throw new UnauthorizedException('Invalid signaling secret');
    }
    const sessionId = cuidSchema.parse(body?.sessionId);
    await this.sessions.markEnded(sessionId);
  }

  /* ------------------------------ Public ---------------------------------- */

  // Tighter than the global budget: this is the route an attacker would use
  // to sweep the 5-character code space looking for live sessions.
  @Throttle({ short: { ttl: 1_000, limit: 2 }, medium: { ttl: 60_000, limit: 10 } })
  @Get(':code/info')
  async info(@Param('code') rawCode: string): Promise<SessionInfoResponse> {
    const code = sessionCodeSchema.parse(rawCode);
    return this.sessions.getPublicInfo(code);
  }

  // Tightest budget in the app: every successful join mints Cloudflare TURN
  // credentials that we pay for by the GB.
  @Throttle({ short: { ttl: 1_000, limit: 1 }, medium: { ttl: 60_000, limit: 5 } })
  @Post(':code/join')
  @HttpCode(HttpStatus.OK)
  async join(
    @Param('code') rawCode: string,
    @Body(new ZodValidationPipe(joinSessionRequestSchema)) body: JoinSessionRequest,
  ): Promise<JoinSessionResponse> {
    const code = sessionCodeSchema.parse(rawCode);
    return this.sessions.join(code, body);
  }
}
