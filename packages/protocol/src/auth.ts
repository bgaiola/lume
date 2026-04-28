import { z } from 'zod';

import { cuidSchema, emailSchema, isoDateStringSchema } from './common';

/* -------------------------------------------------------------------------- */
/*  Magic link                                                                 */
/* -------------------------------------------------------------------------- */

export const requestMagicLinkRequestSchema = z.object({
  email: emailSchema,
  redirectTo: z.string().url().optional(),
});
export type RequestMagicLinkRequest = z.infer<typeof requestMagicLinkRequestSchema>;

export const requestMagicLinkResponseSchema = z.object({
  ok: z.literal(true),
  /** Always true so the API does not leak whether the email is registered. */
  emailSent: z.literal(true),
});
export type RequestMagicLinkResponse = z.infer<typeof requestMagicLinkResponseSchema>;

export const magicLinkCallbackRequestSchema = z.object({
  token: z.string().min(20),
});
export type MagicLinkCallbackRequest = z.infer<typeof magicLinkCallbackRequestSchema>;

/* -------------------------------------------------------------------------- */
/*  Auth session                                                               */
/* -------------------------------------------------------------------------- */

export const authenticatedUserSchema = z.object({
  id: cuidSchema,
  email: emailSchema,
  name: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  organizationId: cuidSchema.nullable(),
  createdAt: isoDateStringSchema,
});
export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>;

export const authSessionSchema = z.object({
  user: authenticatedUserSchema,
  accessToken: z.string(),
  accessTokenExpiresAt: isoDateStringSchema,
});
export type AuthSession = z.infer<typeof authSessionSchema>;

/* -------------------------------------------------------------------------- */
/*  JWT payload                                                                */
/* -------------------------------------------------------------------------- */

export const accessTokenPayloadSchema = z.object({
  sub: cuidSchema,
  email: emailSchema,
  organizationId: cuidSchema.nullable(),
  type: z.literal('access'),
});
export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;

export const magicLinkTokenPayloadSchema = z.object({
  sub: emailSchema,
  type: z.literal('magic-link'),
  /** Random nonce so the same email cannot reuse a previous link's signature. */
  nonce: z.string().min(8),
});
export type MagicLinkTokenPayload = z.infer<typeof magicLinkTokenPayloadSchema>;

/** Short-lived token minted for an end customer joining a session. */
export const joinTokenPayloadSchema = z.object({
  sub: z.string(),
  type: z.literal('session-join'),
  sessionCode: z.string(),
  sessionId: cuidSchema,
});
export type JoinTokenPayload = z.infer<typeof joinTokenPayloadSchema>;
