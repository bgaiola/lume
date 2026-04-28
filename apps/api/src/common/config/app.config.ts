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

  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  API_CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:5174'),

  LUME_PUBLIC_URL: z.string().url().default('http://localhost:5173'),
  LUME_CLIENT_PUBLIC_URL: z.string().url().default('http://localhost:5174'),
  LUME_API_PUBLIC_URL: z.string().url().default('http://localhost:3000'),
  LUME_SIGNALING_PUBLIC_URL: z.string().default('ws://localhost:3001'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  JWT_ACCESS_TTL: z.string().default('15m'),
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

    apiPort: env.API_PORT,
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
  };
};
