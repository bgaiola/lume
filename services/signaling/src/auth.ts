import {
  joinTokenPayloadSchema,
  sessionHostTokenPayloadSchema,
  signalingAuthSchema,
  type JoinTokenPayload,
  type SessionHostTokenPayload,
  type SignalingAuth,
} from '@lume/protocol';
import jwt from 'jsonwebtoken';

export interface AuthenticatedHost {
  role: 'host';
  userId: string;
  organizationId: string | null;
  sessionCode: string;
  sessionId: string;
}

export interface AuthenticatedClient {
  role: 'client';
  sessionId: string;
  sessionCode: string;
}

/** Every authenticated peer carries the session it is bound to. */
export type PeerSessionBinding = Pick<AuthenticatedPeer, 'sessionId' | 'sessionCode'>;

export type AuthenticatedPeer = AuthenticatedHost | AuthenticatedClient;

export class SignalingAuthError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_TOKEN' | 'INVALID_SESSION',
  ) {
    super(message);
    this.name = 'SignalingAuthError';
  }
}

/**
 * Validate the Socket.io handshake `auth` payload and verify the bearer JWT.
 *
 * Both roles present a token that names the session inside its signature, and
 * the declared session code must match it. Nothing from the handshake is
 * trusted on its own.
 *
 * This used to be asymmetric: the client presented a session-scoped join
 * token, but the host presented a plain API access token and the session code
 * was taken at face value from the handshake. Since signup is open, anyone
 * could request a magic link for their own address, get a valid access token
 * within a minute, declare a stranger's session code, and take over the room.
 * The real technician was disconnected without notice and the customer kept
 * sharing their screen, now to the intruder. Hosts therefore present a
 * dedicated `session-host` token minted by POST /v1/sessions.
 */
export function authenticatePeer(
  rawAuth: unknown,
  jwtSecret: string,
): AuthenticatedPeer {
  const parsedAuth = signalingAuthSchema.safeParse(rawAuth);
  if (!parsedAuth.success) {
    throw new SignalingAuthError(
      `handshake auth payload failed validation: ${parsedAuth.error.message}`,
      'INVALID_TOKEN',
    );
  }
  const auth: SignalingAuth = parsedAuth.data;

  let raw: unknown;
  try {
    raw = jwt.verify(auth.token, jwtSecret);
  } catch (e) {
    throw new SignalingAuthError(
      `JWT verification failed: ${e instanceof Error ? e.message : 'unknown'}`,
      'INVALID_TOKEN',
    );
  }

  if (auth.role === 'host') {
    const parsed = sessionHostTokenPayloadSchema.safeParse(raw);
    if (!parsed.success || parsed.data.type !== 'session-host') {
      throw new SignalingAuthError(
        'expected a session-host token for host role',
        'INVALID_TOKEN',
      );
    }
    const payload: SessionHostTokenPayload = parsed.data;
    if (payload.sessionCode !== auth.sessionCode) {
      throw new SignalingAuthError(
        'token session code does not match handshake session code',
        'INVALID_SESSION',
      );
    }
    return {
      role: 'host',
      userId: payload.sub,
      organizationId: payload.organizationId,
      sessionCode: payload.sessionCode,
      sessionId: payload.sessionId,
    };
  }

  const parsed = joinTokenPayloadSchema.safeParse(raw);
  if (!parsed.success || parsed.data.type !== 'session-join') {
    throw new SignalingAuthError(
      'expected a session-join token for client role',
      'INVALID_TOKEN',
    );
  }
  const payload: JoinTokenPayload = parsed.data;
  if (payload.sessionCode !== auth.sessionCode) {
    throw new SignalingAuthError(
      'token session code does not match handshake session code',
      'INVALID_SESSION',
    );
  }
  return {
    role: 'client',
    sessionId: payload.sessionId,
    sessionCode: payload.sessionCode,
  };
}
