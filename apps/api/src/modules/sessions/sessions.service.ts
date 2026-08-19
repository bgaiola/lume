import { randomBytes } from 'node:crypto';

import {
  type CreateSessionRequest,
  type CreateSessionResponse,
  type JoinSessionRequest,
  type JoinSessionResponse,
  type ListSessionsQuery,
  type ListSessionsResponse,
  type Session,
  type SessionInfoResponse,
  type SessionMetadata,
  type SessionStatus,
} from '@lume/protocol';
import { generateSessionCode, type SessionCode } from '@lume/shared';
import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, type Session as PrismaSession } from '@prisma/client';

import { type AppConfig } from '../../common/config/app.config';
import { PrismaService } from '../../common/prisma/prisma.service';

const MAX_CODE_GENERATION_RETRIES = 5;

@Injectable()
export class SessionsService {
  private readonly log = new Logger(SessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  /**
   * Create a session with a freshly minted unique code. Retries on the rare
   * event of a code collision (Postgres unique violation -> P2002).
   */
  async create(
    hostUserId: string,
    organizationId: string | null,
    input: CreateSessionRequest,
  ): Promise<CreateSessionResponse> {
    const pendingTtlMs =
      this.config.get('sessionPendingTtlMinutes', { infer: true }) * 60 * 1000;

    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_CODE_GENERATION_RETRIES; attempt += 1) {
      const code = generateSessionCode();
      try {
        const created = await this.prisma.session.create({
          data: {
            code,
            hostUserId,
            organizationId,
            clientName: input.clientName,
            status: 'PENDING',
            expiresAt: new Date(Date.now() + pendingTtlMs),
          },
        });
        const session = this.toDto(created);
        const host = await this.mintHostToken(created);
        return {
          session,
          joinUrl: this.buildJoinUrl(code),
          hostToken: host.token,
          hostTokenExpiresAt: host.expiresAt.toISOString() as CreateSessionResponse['hostTokenExpiresAt'],
          iceServers: await this.buildIceServers(),
          signalingUrl: this.config.get('lumeSignalingPublicUrl', { infer: true }),
        };
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          this.log.warn({ attempt, code }, 'session code collision, retrying');
          lastError = e;
          continue;
        }
        throw e;
      }
    }
    this.log.error({ err: lastError }, 'exhausted retries generating session code');
    throw new ServiceUnavailableException('Could not allocate a unique session code');
  }

  async list(
    organizationId: string | null,
    hostUserId: string,
    query: ListSessionsQuery,
  ): Promise<ListSessionsResponse> {
    const where: Prisma.SessionWhereInput = organizationId ? { organizationId } : { hostUserId };
    if (query.status) {
      where.status = query.status;
    }

    const sessions = await this.prisma.session.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasMore = sessions.length > query.limit;
    const items = hasMore ? sessions.slice(0, -1) : sessions;
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

    return {
      sessions: items.map((s) => this.toDto(s)),
      nextCursor: nextCursor as ListSessionsResponse['nextCursor'],
    };
  }

  async getPublicInfo(code: string): Promise<SessionInfoResponse> {
    const session = await this.prisma.session.findUnique({
      where: { code },
      include: {
        hostUser: { select: { name: true, email: true } },
        organization: { select: { name: true } },
      },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    this.assertJoinable(session);

    const hostName =
      session.hostUser.name ?? session.hostUser.email.split('@')[0] ?? 'A Lume technician';

    return {
      code: session.code as SessionInfoResponse['code'],
      status: session.status,
      hostName,
      organizationName: session.organization?.name ?? null,
    };
  }

  async join(code: string, input: JoinSessionRequest): Promise<JoinSessionResponse> {
    const session = await this.prisma.session.findUnique({ where: { code } });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    this.assertJoinable(session);

    // The customer just arrived, so the short PENDING window is replaced by
    // the ceiling for a live session. Without this the session would expire
    // 15 minutes into a support call that is going fine.
    const startedAt = session.startedAt ?? new Date();
    const maxDurationMs =
      this.config.get('sessionMaxDurationMinutes', { infer: true }) * 60 * 1000;
    const expiresAt =
      session.status === 'ACTIVE'
        ? session.expiresAt
        : new Date(startedAt.getTime() + maxDurationMs);

    const updated = await this.prisma.session.update({
      where: { id: session.id },
      data: {
        clientName: input.clientName ?? session.clientName,
        metadata: (input.metadata as Prisma.InputJsonValue | undefined) ?? undefined,
        status: 'ACTIVE',
        startedAt,
        expiresAt,
      },
    });

    // The join token must never outlive the session it unlocks, otherwise a
    // leaked token keeps working after the session is closed.
    const joinTokenExpiresAt = earliest(expiresAt, new Date(Date.now() + 15 * 60 * 1000));
    const joinToken = await this.jwt.signAsync(
      {
        sub: `session-join:${session.id}`,
        type: 'session-join',
        sessionCode: session.code,
        sessionId: session.id,
      },
      { expiresIn: secondsUntil(joinTokenExpiresAt) },
    );

    return {
      session: this.toDto(updated),
      joinToken,
      joinTokenExpiresAt:
        joinTokenExpiresAt.toISOString() as JoinSessionResponse['joinTokenExpiresAt'],
      iceServers: await this.buildIceServers(),
      signalingUrl: this.config.get('lumeSignalingPublicUrl', { infer: true }),
    };
  }

  /**
   * Mark a session ended. Called by the signaling service over an internal
   * webhook when the room empties, and by the sweep below.
   */
  async markEnded(sessionId: string): Promise<void> {
    const result = await this.prisma.session.updateMany({
      where: { id: sessionId, status: { in: ['PENDING', 'ACTIVE'] } },
      data: { status: 'ENDED', endedAt: new Date() },
    });
    if (result.count > 0) {
      this.log.log({ sessionId }, 'session ended');
    }
  }

  /**
   * End a session on the technician's request. Ownership is checked here and
   * not in the controller so every caller goes through the same rule: you may
   * only end a session you host, or one belonging to your organization.
   */
  async endAsHost(
    sessionId: string,
    userId: string,
    organizationId: string | null,
  ): Promise<Session> {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    const ownsIt =
      session.hostUserId === userId ||
      (organizationId !== null && session.organizationId === organizationId);
    if (!ownsIt) {
      throw new ForbiddenException('Not your session');
    }
    if (session.status === 'ENDED' || session.status === 'CANCELLED') {
      return this.toDto(session);
    }
    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: 'ENDED', endedAt: new Date() },
    });
    return this.toDto(updated);
  }

  /**
   * Close sessions that ran past their expiry. Covers the cases the disconnect
   * webhook cannot: the API restarted, the signaling service died, or a tab
   * was left open. Returns how many were closed so the caller can log it.
   */
  async sweepExpired(now: Date = new Date()): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: { status: { in: ['PENDING', 'ACTIVE'] }, expiresAt: { lt: now } },
      data: { status: 'ENDED', endedAt: now },
    });
    return result.count;
  }

  /**
   * A session accepts clients only while it is open AND unexpired. Expiry is
   * reported separately from "ended" so the customer sees "este enlace ha
   * caducado" instead of a generic conflict.
   */
  private assertJoinable(session: Pick<PrismaSession, 'status' | 'expiresAt'>): void {
    if (session.status === 'ENDED' || session.status === 'CANCELLED') {
      throw new ConflictException('Session is no longer accepting clients');
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new GoneException('Session link has expired');
    }
  }

  /**
   * Mint the token that lets this technician host this specific session.
   *
   * The signaling service used to accept a plain access token plus whatever
   * session code the caller typed, so any account could take over any live
   * session. Binding the code into the signature is what closes that.
   */
  private async mintHostToken(
    session: PrismaSession,
  ): Promise<{ token: string; expiresAt: Date }> {
    const expiresAt = earliest(session.expiresAt, new Date(Date.now() + 8 * 60 * 60 * 1000));
    const token = await this.jwt.signAsync(
      {
        sub: session.hostUserId,
        type: 'session-host',
        sessionCode: session.code,
        sessionId: session.id,
        organizationId: session.organizationId,
      },
      { expiresIn: secondsUntil(expiresAt) },
    );
    return { token, expiresAt };
  }

  /**
   * Re-mint a host token for a session the technician already owns, so a
   * reconnect does not require creating a new session (and a new code the
   * customer would have to be sent again).
   */
  async refreshHostToken(
    idOrCode: string,
    userId: string,
    organizationId: string | null,
  ): Promise<{ token: string; expiresAt: Date; iceServers: JoinSessionResponse['iceServers'] }> {
    // The panel reaches a live session by its code (that is what the URL
    // carries), while other callers hold the id. Accepting either saves the
    // round trip that translating one into the other would need.
    const session = await this.prisma.session.findFirst({
      where: { OR: [{ id: idOrCode }, { code: idOrCode.toUpperCase() }] },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    const ownsIt =
      session.hostUserId === userId ||
      (organizationId !== null && session.organizationId === organizationId);
    if (!ownsIt) {
      throw new ForbiddenException('Not your session');
    }
    this.assertJoinable(session);
    const { token, expiresAt } = await this.mintHostToken(session);
    // The technician needs relay credentials too. Handing them only to the
    // customer left the technician unable to connect from a factory network
    // that blocks direct peer traffic, which is exactly where support happens.
    return { token, expiresAt, iceServers: await this.buildIceServers() };
  }

  /**
   * Mints an opaque session-join nonce. Currently unused but kept for the
   * client-web flow when we move from URL-based codes to QR-bound nonces.
   */
  static newOpaqueNonce(): string {
    return randomBytes(16).toString('base64url');
  }

  private buildJoinUrl(code: string): string {
    const base = this.config.get('lumeClientPublicUrl', { infer: true });
    return `${base.replace(/\/$/, '')}/${code}`;
  }

  private async buildIceServers(): Promise<JoinSessionResponse['iceServers']> {
    const cloudflareTokenId = this.config.get('cloudflareTurnTokenId', { infer: true });
    const cloudflareApiToken = this.config.get('cloudflareTurnApiToken', { infer: true });

    if (cloudflareTokenId && cloudflareApiToken) {
      try {
        return await this.fetchCloudflareCallsTurn(cloudflareTokenId, cloudflareApiToken);
      } catch (err) {
        this.log.error({ err }, 'Cloudflare Calls TURN unavailable, falling back to static config');
      }
    }

    const stunUrls = this.config.get('stunUrls', { infer: true });
    const turnUrl = this.config.get('turnUrl', { infer: true });
    const turnUsername = this.config.get('turnUsername', { infer: true });
    const turnPassword = this.config.get('turnPassword', { infer: true });
    const turnUrls = [turnUrl, `${turnUrl}?transport=tcp`];
    return [
      { urls: stunUrls },
      { urls: turnUrls, username: turnUsername, credential: turnPassword },
    ];
  }

  /**
   * Mint a fresh ICE-server config from Cloudflare Calls TURN. Credentials
   * are short-lived (TTL controlled by env), so the customer browser gets
   * a unique username / credential per session join. The long-lived API
   * token never leaves the server.
   */
  private async fetchCloudflareCallsTurn(
    tokenId: string,
    apiToken: string,
  ): Promise<JoinSessionResponse['iceServers']> {
    const ttl = this.config.get('cloudflareTurnTtlSeconds', { infer: true });
    const response = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(tokenId)}/credentials/generate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ttl }),
      },
    );
    if (!response.ok) {
      throw new Error(`Cloudflare Calls TURN responded ${response.status}`);
    }
    const data = (await response.json()) as {
      iceServers: { urls: string[]; username: string; credential: string };
    };
    return [
      {
        urls: data.iceServers.urls,
        username: data.iceServers.username,
        credential: data.iceServers.credential,
      },
    ];
  }

  private toDto(s: PrismaSession): Session {
    return {
      id: s.id as Session['id'],
      code: s.code as Session['code'],
      status: s.status as SessionStatus,
      hostUserId: s.hostUserId as Session['hostUserId'],
      organizationId: s.organizationId as Session['organizationId'],
      clientName: s.clientName,
      startedAt: (s.startedAt?.toISOString() ?? null) as Session['startedAt'],
      endedAt: (s.endedAt?.toISOString() ?? null) as Session['endedAt'],
      createdAt: s.createdAt.toISOString() as Session['createdAt'],
      metadata: (s.metadata as SessionMetadata | null) ?? null,
    };
  }

  /** Exposed for tests / local dev. */
  static codeBrand(code: string): SessionCode {
    return code as SessionCode;
  }
}

/** The earlier of two instants. */
function earliest(a: Date, b: Date): Date {
  return a.getTime() <= b.getTime() ? a : b;
}

/**
 * Whole seconds from now until `when`, floored at 1.
 *
 * `jsonwebtoken` rejects a zero or negative `expiresIn`, and a session that is
 * already expiring should mint a token that dies immediately rather than throw.
 */
function secondsUntil(when: Date): number {
  return Math.max(1, Math.floor((when.getTime() - Date.now()) / 1000));
}
