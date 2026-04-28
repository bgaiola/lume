import {
  accessTokenPayloadSchema,
  type AccessTokenPayload,
  type AuthSession,
  type AuthenticatedUser,
  type RequestMagicLinkRequest,
} from '@lume/protocol';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { type AppConfig } from '../../common/config/app.config';
import { PrismaService } from '../../common/prisma/prisma.service';

import { EmailService } from './email.service';
import { MagicLinkService } from './magic-link.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly magicLink: MagicLinkService,
    private readonly email: EmailService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async requestMagicLink(input: RequestMagicLinkRequest): Promise<void> {
    const { email } = input;

    // We always create the user lazily on the first magic-link click
    // (in completeMagicLink). Sending the email even if the user does
    // not exist yet is intentional: it doubles as the sign-up path.
    const token = await this.magicLink.issue(email);

    const callbackUrl = new URL(
      '/auth/callback',
      this.config.get('lumePublicUrl', { infer: true }),
    );
    callbackUrl.searchParams.set('token', token);

    await this.email.sendMagicLink({
      to: email,
      url: callbackUrl.toString(),
    });
  }

  async completeMagicLink(token: string): Promise<AuthSession> {
    const payload = await this.magicLink.verify(token);

    // Upsert keeps the magic-link flow idempotent: same email lands the
    // same user record, never duplicates on retries.
    const user = await this.prisma.user.upsert({
      where: { email: payload.sub },
      update: {},
      create: { email: payload.sub },
    });

    const accessTokenPayload: AccessTokenPayload = accessTokenPayloadSchema.parse({
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      type: 'access',
    });

    const accessTtl = this.config.get('jwtAccessTtl', { infer: true });
    const accessToken = await this.jwt.signAsync(accessTokenPayload, { expiresIn: accessTtl });
    const expiresAt = new Date(Date.now() + parseTtlMs(accessTtl));

    return {
      user: this.toAuthenticatedUser(user),
      accessToken,
      accessTokenExpiresAt: expiresAt.toISOString() as AuthSession['accessTokenExpiresAt'],
    };
  }

  async verifyAccessToken(token: string): Promise<AuthenticatedUser> {
    let raw: unknown;
    try {
      raw = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    const parsed = accessTokenPayloadSchema.safeParse(raw);
    if (!parsed.success || parsed.data.type !== 'access') {
      throw new UnauthorizedException('Malformed token payload');
    }

    const user = await this.prisma.user.findUnique({ where: { id: parsed.data.sub } });
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return this.toAuthenticatedUser(user);
  }

  private toAuthenticatedUser(user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    organizationId: string | null;
    createdAt: Date;
  }): AuthenticatedUser {
    return {
      id: user.id as AuthenticatedUser['id'],
      email: user.email as AuthenticatedUser['email'],
      name: user.name,
      avatarUrl: user.avatarUrl,
      organizationId: user.organizationId as AuthenticatedUser['organizationId'],
      createdAt: user.createdAt.toISOString() as AuthenticatedUser['createdAt'],
    };
  }
}

/**
 * Best-effort conversion from a `1h` / `15m` / `30d` style TTL to ms.
 * Used purely to compute the `expiresAt` field returned to the client.
 */
function parseTtlMs(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl.trim());
  if (!match) {
    return 15 * 60 * 1000;
  }
  const value = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 15 * 60 * 1000;
  }
}
