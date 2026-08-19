import { z } from 'zod';

/**
 * Strongly-typed application configuration.
 *
 * Every variable consumed by the API is declared here. The Zod schema
 * validates `process.env` at boot time, so a missing or malformed value
 * fails fast rather than crashing later in a request handler.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Render (and most PaaS) inject the port to bind on as PORT and route
  // traffic to it. Binding to our own API_PORT there means the health check
  // never passes and the deploy is rolled back with no obvious reason.
  PORT: z.coerce.number().int().min(1).max(65535).optional(),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  API_CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:5174'),

  LUME_PUBLIC_URL: z.string().url().default('http://localhost:5173'),
  LUME_CLIENT_PUBLIC_URL: z.string().url().default('http://localhost:5174'),
  LUME_API_PUBLIC_URL: z.string().url().default('http://localhost:3000'),
  LUME_SIGNALING_PUBLIC_URL: z.string().default('ws://localhost:3001'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  JWT_ACCESS_TTL: z.string().default('8h'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  MAGIC_LINK_SECRET: z.string().min(32, 'MAGIC_LINK_SECRET must be at least 32 chars'),
  MAGIC_LINK_TTL: z.string().default('15m'),

  RESEND_API_KEY: z.string().default(''),
  EMAIL_FROM: z.string().default('Lume <hello@lume.app>'),
  EMAIL_REPLY_TO: z.string().default('support@lume.app'),

  TURN_URL: z.string().default('turn:localhost:3478'),
  TURN_USERNAME: z.string().default('lume'),
  TURN_PASSWORD: z.string().default('lume_dev_turn_password'),
  STUN_URLS: z.string().default('stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302'),

  // Cloudflare Calls TURN. When both vars are present, the API mints a
  // fresh ICE-server config per /sessions/:code/join request and ignores
  // the static TURN_URL / TURN_USERNAME / TURN_PASSWORD above. Production
  // setting; leave empty in dev to use the local coturn.
  CLOUDFLARE_TURN_TOKEN_ID: z.string().default(''),
  CLOUDFLARE_TURN_API_TOKEN: z.string().default(''),
  // One hour, not one day. These credentials are handed to any browser that
  // knows a session code, and Cloudflare bills the relayed traffic by the GB.
  CLOUDFLARE_TURN_TTL_SECONDS: z.coerce.number().int().min(60).max(86400).default(3600),

  // How long a freshly created session stays joinable before it goes stale.
  SESSION_PENDING_TTL_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),
  // Ceiling for an established session, so an abandoned tab cannot hold a
  // room (and TURN budget) open forever.
  SESSION_MAX_DURATION_MINUTES: z.coerce.number().int().min(5).max(1440).default(240),
  // Shared secret the signaling service presents when reporting that a room
  // emptied, so only it can end sessions on the API.
  SIGNALING_WEBHOOK_SECRET: z.string().min(16).default('dev_signaling_webhook_secret_change_me'),
});

export type Env = z.infer<typeof envSchema>;

export interface AppConfig {
  nodeEnv: Env['NODE_ENV'];
  logLevel: Env['LOG_LEVEL'];

  apiPort: number;
  apiCorsOrigins: string[];

  lumePublicUrl: string;
  lumeClientPublicUrl: string;
  lumeApiPublicUrl: string;
  lumeSignalingPublicUrl: string;

  databaseUrl: string;
  redisUrl: string;

  jwtSecret: string;
  jwtAccessTtl: string;
  jwtRefreshTtl: string;

  magicLinkSecret: string;
  magicLinkTtl: string;

  resendApiKey: string;
  emailFrom: string;
  emailReplyTo: string;

  turnUrl: string;
  turnUsername: string;
  turnPassword: string;
  stunUrls: string[];

  cloudflareTurnTokenId: string;
  cloudflareTurnApiToken: string;
  cloudflareTurnTtlSeconds: number;

  sessionPendingTtlMinutes: number;
  sessionMaxDurationMinutes: number;
  signalingWebhookSecret: string;
}

/**
 * NestJS ConfigModule loader. Returning a single namespaced object keeps
 * `ConfigService.get('apiPort')` strongly typed via the `AppConfig` shape.
 */
export const appConfigLoader = (): AppConfig => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  const env = parsed.data;
  return {
    nodeEnv: env.NODE_ENV,
    logLevel: env.LOG_LEVEL,

    apiPort: env.PORT ?? env.API_PORT,
    apiCorsOrigins: env.API_CORS_ORIGINS.split(',')
      .map((s) => s.trim())
      .filter(Boolean),

    lumePublicUrl: env.LUME_PUBLIC_URL,
    lumeClientPublicUrl: env.LUME_CLIENT_PUBLIC_URL,
    lumeApiPublicUrl: env.LUME_API_PUBLIC_URL,
    lumeSignalingPublicUrl: env.LUME_SIGNALING_PUBLIC_URL,

    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,

    jwtSecret: env.JWT_SECRET,
    jwtAccessTtl: env.JWT_ACCESS_TTL,
    jwtRefreshTtl: env.JWT_REFRESH_TTL,

    magicLinkSecret: env.MAGIC_LINK_SECRET,
    magicLinkTtl: env.MAGIC_LINK_TTL,

    resendApiKey: env.RESEND_API_KEY,
    emailFrom: env.EMAIL_FROM,
    emailReplyTo: env.EMAIL_REPLY_TO,

    turnUrl: env.TURN_URL,
    turnUsername: env.TURN_USERNAME,
    turnPassword: env.TURN_PASSWORD,
    stunUrls: env.STUN_URLS.split(',')
      .map((s) => s.trim())
      .filter(Boolean),

    cloudflareTurnTokenId: env.CLOUDFLARE_TURN_TOKEN_ID,
    cloudflareTurnApiToken: env.CLOUDFLARE_TURN_API_TOKEN,
    cloudflareTurnTtlSeconds: env.CLOUDFLARE_TURN_TTL_SECONDS,

    sessionPendingTtlMinutes: env.SESSION_PENDING_TTL_MINUTES,
    sessionMaxDurationMinutes: env.SESSION_MAX_DURATION_MINUTES,
    signalingWebhookSecret: env.SIGNALING_WEBHOOK_SECRET,
  };
};
