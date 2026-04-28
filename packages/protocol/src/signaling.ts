import { z } from 'zod';

import { cuidSchema, sessionCodeSchema } from './common';

/**
 * Wire-level contracts for the Socket.io signaling service.
 *
 * Block 3 implements the signaling service. The schemas live here so both
 * the server (services/signaling) and the browser SDK (packages/webrtc)
 * can validate every payload against the same source of truth.
 */

/* -------------------------------------------------------------------------- */
/*  Roles                                                                      */
/* -------------------------------------------------------------------------- */

export const signalingRoleSchema = z.enum(['host', 'client']);
export type SignalingRole = z.infer<typeof signalingRoleSchema>;

/* -------------------------------------------------------------------------- */
/*  Handshake auth payload (sent in Socket.io `auth` field)                    */
/* -------------------------------------------------------------------------- */

export const signalingAuthSchema = z.object({
  role: signalingRoleSchema,
  token: z.string().min(10),
  sessionCode: sessionCodeSchema,
});
export type SignalingAuth = z.infer<typeof signalingAuthSchema>;

/* -------------------------------------------------------------------------- */
/*  Server -> client events                                                    */
/* -------------------------------------------------------------------------- */

export const peerJoinedEventSchema = z.object({
  role: signalingRoleSchema,
  socketId: z.string(),
  sessionId: cuidSchema,
});
export type PeerJoinedEvent = z.infer<typeof peerJoinedEventSchema>;

export const peerLeftEventSchema = z.object({
  role: signalingRoleSchema,
  socketId: z.string(),
});
export type PeerLeftEvent = z.infer<typeof peerLeftEventSchema>;

export const signalingErrorEventSchema = z.object({
  code: z.enum(['INVALID_TOKEN', 'INVALID_SESSION', 'SESSION_FULL', 'PEER_NOT_FOUND', 'INTERNAL']),
  message: z.string(),
});
export type SignalingErrorEvent = z.infer<typeof signalingErrorEventSchema>;

/* -------------------------------------------------------------------------- */
/*  WebRTC negotiation messages                                                */
/* -------------------------------------------------------------------------- */

export const sdpDescriptionSchema = z.object({
  type: z.enum(['offer', 'answer', 'pranswer', 'rollback']),
  sdp: z.string(),
});
export type SdpDescription = z.infer<typeof sdpDescriptionSchema>;

export const sdpMessageSchema = z.object({
  to: z.string(),
  from: z.string(),
  description: sdpDescriptionSchema,
});
export type SdpMessage = z.infer<typeof sdpMessageSchema>;

export const iceCandidateSchema = z.object({
  candidate: z.string(),
  sdpMid: z.string().nullable(),
  sdpMLineIndex: z.number().int().nullable(),
  usernameFragment: z.string().nullable().optional(),
});
export type IceCandidate = z.infer<typeof iceCandidateSchema>;

export const iceCandidateMessageSchema = z.object({
  to: z.string(),
  from: z.string(),
  candidate: iceCandidateSchema.nullable(),
});
export type IceCandidateMessage = z.infer<typeof iceCandidateMessageSchema>;

/* -------------------------------------------------------------------------- */
/*  Control channel (mouse, keyboard) — wire stubs for Block 3                 */
/* -------------------------------------------------------------------------- */

export const controlEventSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('cursor-move'),
    x: z.number(),
    y: z.number(),
    timestamp: z.number().int(),
  }),
  z.object({
    kind: z.literal('cursor-click'),
    x: z.number(),
    y: z.number(),
    button: z.enum(['left', 'middle', 'right']),
    timestamp: z.number().int(),
  }),
  z.object({
    kind: z.literal('key'),
    code: z.string(),
    pressed: z.boolean(),
    timestamp: z.number().int(),
  }),
]);
export type ControlEvent = z.infer<typeof controlEventSchema>;

/* -------------------------------------------------------------------------- */
/*  Event name catalog                                                         */
/* -------------------------------------------------------------------------- */

export const SIGNALING_EVENTS = {
  peerJoined: 'peer:joined',
  peerLeft: 'peer:left',
  sdp: 'webrtc:sdp',
  ice: 'webrtc:ice',
  control: 'control:event',
  error: 'lume:error',
} as const;
export type SignalingEventName = (typeof SIGNALING_EVENTS)[keyof typeof SIGNALING_EVENTS];
