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
          },
        });
        const session = this.toDto(created);
        return {
          session,
          joinUrl: this.buildJoinUrl(code),
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
    if (session.status === 'ENDED' || session.status === 'CANCELLED') {
      throw new ConflictException('Session is no longer accepting clients');
    }

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
    if (session.status === 'ENDED' || session.status === 'CANCELLED') {
      throw new ConflictException('Session is no longer accepting clients');
    }

    const updated = await this.prisma.session.update({
      where: { id: session.id },
      data: {
        clientName: input.clientName ?? session.clientName,
        metadata: (input.metadata as Prisma.InputJsonValue | undefined) ?? undefined,
        status: 'ACTIVE',
        startedAt: session.startedAt ?? new Date(),
      },
    });

    const joinTokenTtl = '1h';
    const joinToken = await this.jwt.signAsync(
      {
        sub: `session-join:${session.id}`,
        type: 'session-join',
        sessionCode: session.code,
        sessionId: session.id,
      },
      { expiresIn: joinTokenTtl },
    );
    const joinTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

    return {
      session: this.toDto(updated),
      joinToken,
      joinTokenExpiresAt:
        joinTokenExpiresAt.toISOString() as JoinSessionResponse['joinTokenExpiresAt'],
      iceServers: this.buildIceServers(),
      signalingUrl: this.config.get('lumeSignalingPublicUrl', { infer: true }),
    };
  }

  /**
   * Mark a session ended. Used when the host or client disconnects.
   * Block 3 (signaling) wires this in via a webhook.
   */
  async markEnded(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, status: { in: ['PENDING', 'ACTIVE'] } },
      data: { status: 'ENDED', endedAt: new Date() },
    });
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

  private buildIceServers(): JoinSessionResponse['iceServers'] {
    const stunUrls = this.config.get('stunUrls', { infer: true });
    const turnUrl = this.config.get('turnUrl', { infer: true });
    const turnUsername = this.config.get('turnUsername', { infer: true });
    const turnPassword = this.config.get('turnPassword', { infer: true });
    return [
      { urls: stunUrls },
      { urls: turnUrl, username: turnUsername, credential: turnPassword },
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
