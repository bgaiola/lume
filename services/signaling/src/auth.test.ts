import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';

import { authenticatePeer, SignalingAuthError } from './auth';

const SECRET = 'test-secret-at-least-32-characters-long!!';
const CODE = 'K7M2P';
const OTHER_CODE = 'A9B4C';
const SESSION_ID = 'clh1234567890abcdefghijkl';
const USER_ID = 'clu1234567890abcdefghijkl';

function hostToken(overrides: Record<string, unknown> = {}): string {
  return jwt.sign(
    {
      sub: USER_ID,
      type: 'session-host',
      sessionCode: CODE,
      sessionId: SESSION_ID,
      organizationId: null,
      ...overrides,
    },
    SECRET,
  );
}

function joinToken(overrides: Record<string, unknown> = {}): string {
  return jwt.sign(
    {
      sub: `session-join:${SESSION_ID}`,
      type: 'session-join',
      sessionCode: CODE,
      sessionId: SESSION_ID,
      ...overrides,
    },
    SECRET,
  );
}

/** The plain API access token, which used to be accepted for the host role. */
function accessToken(): string {
  return jwt.sign(
    { sub: USER_ID, email: 'someone@example.com', organizationId: null, type: 'access' },
    SECRET,
  );
}

describe('authenticatePeer, host role', () => {
  it('accepts a session-host token whose code matches the handshake', () => {
    const peer = authenticatePeer({ role: 'host', token: hostToken(), sessionCode: CODE }, SECRET);
    expect(peer).toEqual({
      role: 'host',
      userId: USER_ID,
      organizationId: null,
      sessionCode: CODE,
      sessionId: SESSION_ID,
    });
  });

  // The session hijack: signup is open, so anyone can hold a valid access
  // token within a minute. Before the fix this call succeeded and handed the
  // caller the host seat of a stranger's live session.
  it('rejects a plain API access token', () => {
    expect(() =>
      authenticatePeer({ role: 'host', token: accessToken(), sessionCode: CODE }, SECRET),
    ).toThrow(SignalingAuthError);
  });

  // Same attack, one step further along: even holding a legitimate host token
  // for your OWN session, you may not point it at somebody else's code.
  it('rejects a host token minted for a different session', () => {
    expect(() =>
      authenticatePeer(
        { role: 'host', token: hostToken({ sessionCode: OTHER_CODE }), sessionCode: CODE },
        SECRET,
      ),
    ).toThrow(/session code does not match/);
  });

  it('rejects a client join token presented as host', () => {
    expect(() =>
      authenticatePeer({ role: 'host', token: joinToken(), sessionCode: CODE }, SECRET),
    ).toThrow(/expected a session-host token/);
  });

  it('rejects a token signed with the wrong secret', () => {
    const forged = jwt.sign(
      { sub: USER_ID, type: 'session-host', sessionCode: CODE, sessionId: SESSION_ID, organizationId: null },
      'a-different-secret-that-is-long-enough!!',
    );
    expect(() =>
      authenticatePeer({ role: 'host', token: forged, sessionCode: CODE }, SECRET),
    ).toThrow(/JWT verification failed/);
  });

  it('rejects an expired host token', () => {
    const expired = jwt.sign(
      { sub: USER_ID, type: 'session-host', sessionCode: CODE, sessionId: SESSION_ID, organizationId: null },
      SECRET,
      { expiresIn: -10 },
    );
    expect(() =>
      authenticatePeer({ role: 'host', token: expired, sessionCode: CODE }, SECRET),
    ).toThrow(/JWT verification failed/);
  });
});

describe('authenticatePeer, client role', () => {
  it('accepts a join token whose code matches the handshake', () => {
    const peer = authenticatePeer({ role: 'client', token: joinToken(), sessionCode: CODE }, SECRET);
    expect(peer).toEqual({ role: 'client', sessionId: SESSION_ID, sessionCode: CODE });
  });

  it('rejects a join token minted for a different session', () => {
    expect(() =>
      authenticatePeer(
        { role: 'client', token: joinToken({ sessionCode: OTHER_CODE }), sessionCode: CODE },
        SECRET,
      ),
    ).toThrow(/session code does not match/);
  });

  it('rejects a host token presented as client', () => {
    expect(() =>
      authenticatePeer({ role: 'client', token: hostToken(), sessionCode: CODE }, SECRET),
    ).toThrow(/expected a session-join token/);
  });
});

describe('authenticatePeer, malformed handshake', () => {
  it.each([
    ['missing everything', {}],
    ['unknown role', { role: 'admin', token: hostToken(), sessionCode: CODE }],
    ['no token', { role: 'host', sessionCode: CODE }],
    ['token too short', { role: 'host', token: 'abc', sessionCode: CODE }],
    ['malformed session code', { role: 'host', token: hostToken(), sessionCode: 'not-a-code' }],
    ['null', null],
  ])('rejects %s', (_label, payload) => {
    expect(() => authenticatePeer(payload, SECRET)).toThrow(SignalingAuthError);
  });
});
