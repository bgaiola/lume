import { z } from 'zod';

/**
 * Strongly-typed runtime configuration for the signaling service.
 *
 * Validated at boot. The signaling service shares JWT secrets with the API
 * so it can verify both host access tokens and client join tokens without
 * round-tripping back to apps/api.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  SIGNALING_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  SIGNALING_CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://localhost:5174'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  // Where to report that a room emptied, so the API can close the session.
  LUME_API_PUBLIC_URL: z.string().url().default('http://localhost:3000'),
  SIGNALING_WEBHOOK_SECRET: z.string().min(16).default('dev_signaling_webhook_secret_change_me'),
});

export interface SignalingConfig {
  nodeEnv: 'development' | 'test' | 'production';
  logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  port: number;
  corsOrigins: string[];
  jwtSecret: string;
  apiBaseUrl: string;
  webhookSecret: string;
}

export function loadConfig(): SignalingConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid signaling environment configuration:\n${issues}`);
  }
  const env = parsed.data;
  return {
    nodeEnv: env.NODE_ENV,
    logLevel: env.LOG_LEVEL,
    port: env.SIGNALING_PORT,
    corsOrigins: env.SIGNALING_CORS_ORIGINS.split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    jwtSecret: env.JWT_SECRET,
    apiBaseUrl: env.LUME_API_PUBLIC_URL,
    webhookSecret: env.SIGNALING_WEBHOOK_SECRET,
  };
}
