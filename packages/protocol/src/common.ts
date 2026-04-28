import { SESSION_CODE_LENGTH, SESSION_CODE_REGEX } from '@lume/shared';
import { z } from 'zod';

/** A Prisma cuid string. Length is 25 in practice, but Prisma reserves 30. */
export const cuidSchema = z
  .string()
  .min(20)
  .max(40)
  .regex(/^c[a-z0-9]+$/i, 'expected a cuid');

/** Email address (lowercased on parse for normalization). */
export const emailSchema = z.string().trim().toLowerCase().email('expected a valid email address');

/** ISO-8601 date string (used for transport instead of Date). */
export const isoDateStringSchema = z
  .string()
  .datetime({ offset: true, message: 'expected an ISO-8601 date string' });

/** Five-character non-ambiguous Lume session code. */
export const sessionCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(SESSION_CODE_LENGTH, `session code must be ${SESSION_CODE_LENGTH} characters`)
  .regex(SESSION_CODE_REGEX, 'session code uses an invalid character');

/** URL-friendly organization slug. */
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(40)
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, 'invalid slug');

/** Standardized error envelope returned by every API endpoint on failure. */
export const apiErrorSchema = z.object({
  statusCode: z.number().int().min(400).max(599),
  error: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  timestamp: isoDateStringSchema,
  path: z.string(),
  requestId: z.string().optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

/** Subscription plan. Mirrors the Prisma enum, kept in sync manually. */
export const planSchema = z.enum(['FREE', 'PRO', 'TEAM', 'ENTERPRISE']);
export type Plan = z.infer<typeof planSchema>;
