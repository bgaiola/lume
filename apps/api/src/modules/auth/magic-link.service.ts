import { randomBytes } from 'node:crypto';

import { magicLinkTokenPayloadSchema, type MagicLinkTokenPayload } from '@lume/protocol';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { type AppConfig } from '../../common/config/app.config';

@Injectable()
export class MagicLinkService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async issue(email: string): Promise<string> {
    const payload: MagicLinkTokenPayload = {
      sub: email as MagicLinkTokenPayload['sub'],
      type: 'magic-link',
      nonce: randomBytes(12).toString('hex'),
    };
    return this.jwt.signAsync(payload, {
      secret: this.config.get('magicLinkSecret', { infer: true }),
      expiresIn: this.config.get('magicLinkTtl', { infer: true }),
    });
  }

  async verify(token: string): Promise<MagicLinkTokenPayload> {
    let raw: unknown;
    try {
      raw = await this.jwt.verifyAsync(token, {
        secret: this.config.get('magicLinkSecret', { infer: true }),
      });
    } catch {
      throw new UnauthorizedException('Magic link is invalid or expired');
    }
    const parsed = magicLinkTokenPayloadSchema.safeParse(raw);
    if (!parsed.success || parsed.data.type !== 'magic-link') {
      throw new UnauthorizedException('Malformed magic-link payload');
    }
    return parsed.data;
  }
}
