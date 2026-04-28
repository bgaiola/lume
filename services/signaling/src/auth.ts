import {
  accessTokenPayloadSchema,
  joinTokenPayloadSchema,
  signalingAuthSchema,
  type AccessTokenPayload,
  type JoinTokenPayload,
  type SignalingAuth,
} from '@lume/protocol';
import jwt from 'jsonwebtoken';

export interface AuthenticatedHost {
  role: 'host';
  userId: string;
  email: string;
  organizationId: string | null;
  sessionCode: string;
}

export interface AuthenticatedClient {
  role: 'client';
  sessionId: string;
  sessionCode: string;
}

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
 * Hosts authenticate with their API access token. The session code they
 * declare in the handshake is trusted because it is unguessable and they
 * just minted it via POST /v1/sessions. Clients authenticate with a
 * short-lived join token issued by POST /v1/sessions/:code/join.
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
    const parsed = accessTokenPayloadSchema.safeParse(raw);
    if (!parsed.success || parsed.data.type !== 'access') {
      throw new SignalingAuthError(
        'expected an access token for host role',
        'INVALID_TOKEN',
      );
    }
    const payload: AccessTokenPayload = parsed.data;
    return {
      role: 'host',
      userId: payload.sub,
      email: payload.email,
      organizationId: payload.organizationId,
      sessionCode: auth.sessionCode,
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
