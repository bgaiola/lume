import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

import { type AppConfig } from '../../common/config/app.config';

interface MagicLinkEmailInput {
  to: string;
  url: string;
}

@Injectable()
export class EmailService {
  private readonly log = new Logger(EmailService.name);
  private readonly resend: Resend | null;

  constructor(private readonly config: ConfigService<AppConfig, true>) {
    const apiKey = this.config.get('resendApiKey', { infer: true });
    this.resend = apiKey ? new Resend(apiKey) : null;
    if (!this.resend) {
      this.log.warn(
        'RESEND_API_KEY not set. Magic-link emails will be logged to stdout only (dev mode).',
      );
    }
  }

  async sendMagicLink({ to, url }: MagicLinkEmailInput): Promise<void> {
    const from = this.config.get('emailFrom', { infer: true });
    const replyTo = this.config.get('emailReplyTo', { infer: true });

    const subject = 'Tu enlace de acceso a Lume';
    const html = renderMagicLinkHtml(url);
    const text = renderMagicLinkText(url);

    if (!this.resend) {
      this.log.warn({ to, url }, '[dev] would have sent magic link email');
      return;
    }

    const { error } = await this.resend.emails.send({
      from,
      to,
      replyTo,
      subject,
      html,
      text,
    });
    if (error) {
      this.log.error({ err: error, to }, 'Failed to send magic link email');
      throw new Error(`Resend send failed: ${error.message}`);
    }
  }
}

function renderMagicLinkHtml(url: string): string {
  return `<!doctype html>
<html lang="es">
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0e0d; color: #f4f7f5; padding: 32px;">
    <div style="max-width: 480px; margin: 0 auto; background: #11161a; border-radius: 12px; padding: 32px;">
      <h1 style="font-size: 22px; margin: 0 0 16px;">Entra en Lume</h1>
      <p style="line-height: 1.6; margin: 0 0 24px;">
        Pulsa el botón para acceder a tu cuenta. El enlace caduca en 15 minutos.
      </p>
      <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #b9ff66; color: #0a0e0d; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Acceder a Lume
      </a>
      <p style="font-size: 12px; color: #8b9290; margin: 32px 0 0;">
        Si no has solicitado este correo, puedes ignorarlo.
      </p>
    </div>
  </body>
</html>`;
}

function renderMagicLinkText(url: string): string {
  return `Entra en Lume\n\nUsa este enlace para acceder a tu cuenta (caduca en 15 minutos):\n${url}\n\nSi no has solicitado este correo, ignóralo.`;
}
