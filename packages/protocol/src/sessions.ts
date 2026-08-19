import { z } from 'zod';

import { cuidSchema, isoDateStringSchema, sessionCodeSchema } from './common';

/* -------------------------------------------------------------------------- */
/*  Enums                                                                      */
/* -------------------------------------------------------------------------- */

export const sessionStatusSchema = z.enum(['PENDING', 'ACTIVE', 'ENDED', 'CANCELLED']);
export type SessionStatus = z.infer<typeof sessionStatusSchema>;

/* -------------------------------------------------------------------------- */
/*  Metadata                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Free-form metadata about the end customer's environment, captured when
 * they join the session. All fields are optional and may be sniffed via
 * the user-agent client hints API or feature detection.
 */
export const sessionMetadataSchema = z.object({
  os: z.string().max(64).optional(),
  osVersion: z.string().max(32).optional(),
  browser: z.string().max(64).optional(),
  browserVersion: z.string().max(32).optional(),
  screenWidth: z.number().int().positive().optional(),
  screenHeight: z.number().int().positive().optional(),
  devicePixelRatio: z.number().positive().optional(),
  language: z.string().max(16).optional(),
  timezone: z.string().max(64).optional(),
});
export type SessionMetadata = z.infer<typeof sessionMetadataSchema>;

/* -------------------------------------------------------------------------- */
/*  Session DTOs                                                               */
/* -------------------------------------------------------------------------- */

export const sessionSchema = z.object({
  id: cuidSchema,
  code: sessionCodeSchema,
  status: sessionStatusSchema,
  hostUserId: cuidSchema,
  organizationId: cuidSchema.nullable(),
  clientName: z.string().nullable(),
  startedAt: isoDateStringSchema.nullable(),
  endedAt: isoDateStringSchema.nullable(),
  createdAt: isoDateStringSchema,
  metadata: sessionMetadataSchema.nullable(),
});
export type Session = z.infer<typeof sessionSchema>;

/* -------------------------------------------------------------------------- */
/*  Create session                                                             */
/* -------------------------------------------------------------------------- */

export const createSessionRequestSchema = z.object({
  clientName: z.string().trim().min(1).max(120).optional(),
});
export type CreateSessionRequest = z.infer<typeof createSessionRequestSchema>;

/**
 * ICE servers (STUN + TURN). Both sides of the call need these: the customer
 * gets them on join, the technician on create. Handing them only to the
 * customer left the technician unable to connect from a corporate network
 * that blocks direct peer traffic, which is exactly where support happens.
 */
export const iceServersSchema = z.array(
  z.object({
    urls: z.union([z.string(), z.array(z.string())]),
    username: z.string().optional(),
    credential: z.string().optional(),
  }),
);
export type IceServers = z.infer<typeof iceServersSchema>;

export const createSessionResponseSchema = z.object({
  session: sessionSchema,
  /**
   * URL the technician can copy to share with the customer. The end customer
   * opens this URL in a browser to start screen sharing.
   */
  joinUrl: z.string().url(),
  /**
   * Short-lived JWT that authorises this technician to host THIS session on
   * the signaling service. The plain access token is no longer accepted there:
   * it proves identity but not ownership of a session code.
   */
  hostToken: z.string(),
  hostTokenExpiresAt: isoDateStringSchema,
  /** ICE servers for the technician side of the connection. */
  iceServers: iceServersSchema,
  signalingUrl: z.string(),
});
export type CreateSessionResponse = z.infer<typeof createSessionResponseSchema>;

/* -------------------------------------------------------------------------- */
/*  Public session info (consumed by the end customer)                         */
/* -------------------------------------------------------------------------- */

export const sessionInfoResponseSchema = z.object({
  code: sessionCodeSchema,
  status: sessionStatusSchema,
  /** Name of the technician hosting the session, displayed to the customer. */
  hostName: z.string(),
  /** Optional organization name, shown next to the technician name. */
  organizationName: z.string().nullable(),
});
export type SessionInfoResponse = z.infer<typeof sessionInfoResponseSchema>;

/* -------------------------------------------------------------------------- */
/*  Join (end customer)                                                        */
/* -------------------------------------------------------------------------- */

export const joinSessionRequestSchema = z.object({
  /** The customer-typed name displayed to the technician. */
  clientName: z.string().trim().min(1).max(120).optional(),
  metadata: sessionMetadataSchema.optional(),
});
export type JoinSessionRequest = z.infer<typeof joinSessionRequestSchema>;

export const joinSessionResponseSchema = z.object({
  session: sessionSchema,
  /**
   * Short-lived JWT the client-web app passes to the signaling service so
   * the relay can match it to a session without an account.
   */
  joinToken: z.string(),
  joinTokenExpiresAt: isoDateStringSchema,
  /** ICE servers (STUN + TURN) the WebRTC client should configure. */
  iceServers: iceServersSchema,
  signalingUrl: z.string(),
});
export type JoinSessionResponse = z.infer<typeof joinSessionResponseSchema>;

/* -------------------------------------------------------------------------- */
/*  Listing                                                                    */
/* -------------------------------------------------------------------------- */

export const listSessionsQuerySchema = z.object({
  status: sessionStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: cuidSchema.optional(),
});
export type ListSessionsQuery = z.infer<typeof listSessionsQuerySchema>;

export const listSessionsResponseSchema = z.object({
  sessions: z.array(sessionSchema),
  nextCursor: cuidSchema.nullable(),
});
export type ListSessionsResponse = z.infer<typeof listSessionsResponseSchema>;
