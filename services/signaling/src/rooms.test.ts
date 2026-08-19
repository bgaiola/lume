import pino from 'pino';
import { beforeEach, describe, expect, it } from 'vitest';

import { MAX_CLIENTS_PER_ROOM, RoomRegistry } from './rooms';

const CODE = 'K7M2P';
const SESSION = 'clh1234567890abcdefghijkl';
const TECH_A = 'user-a';
const TECH_B = 'user-b';

let rooms: RoomRegistry;

beforeEach(() => {
  rooms = new RoomRegistry(pino({ level: 'silent' }));
});

describe('host seat', () => {
  it('gives the seat to the first technician', () => {
    const r = rooms.attachHost(CODE, 'sock-1', TECH_A, SESSION);
    expect(r).toEqual({ ok: true, evicted: null });
  });

  it('lets the same technician reconnect and evicts their stale socket', () => {
    rooms.attachHost(CODE, 'sock-1', TECH_A, SESSION);
    const r = rooms.attachHost(CODE, 'sock-2', TECH_A, SESSION);
    expect(r).toEqual({ ok: true, evicted: 'sock-1' });
  });

  // The takeover: before this check, a second party overwrote the host seat and
  // the real technician was silently disconnected mid-session.
  it('refuses a different technician while the seat is taken', () => {
    rooms.attachHost(CODE, 'sock-1', TECH_A, SESSION);
    const r = rooms.attachHost(CODE, 'sock-2', TECH_B, SESSION);
    expect(r).toEqual({ ok: false, reason: 'OCCUPIED_BY_ANOTHER_USER' });
    expect(rooms.ensure(CODE).hostSocketId).toBe('sock-1');
  });

  it('keeps the seat reserved for the same technician after a drop', () => {
    rooms.attachHost(CODE, 'sock-1', TECH_A, SESSION);
    rooms.attachClient(CODE, 'client-1', SESSION);
    rooms.detach('sock-1');

    expect(rooms.attachHost(CODE, 'sock-2', TECH_B, SESSION)).toEqual({
      ok: false,
      reason: 'OCCUPIED_BY_ANOTHER_USER',
    });
    expect(rooms.attachHost(CODE, 'sock-2', TECH_A, SESSION).ok).toBe(true);
  });
});

describe('client cap', () => {
  it('accepts up to the room limit', () => {
    for (let i = 0; i < MAX_CLIENTS_PER_ROOM; i += 1) {
      expect(rooms.attachClient(CODE, `client-${i}`, SESSION)).toEqual({ ok: true });
    }
  });

  // SESSION_FULL existed in the protocol but was never emitted, so extra peers
  // could sit in a room and learn everyone else's socket id.
  it('refuses the peer beyond the limit', () => {
    for (let i = 0; i < MAX_CLIENTS_PER_ROOM; i += 1) {
      rooms.attachClient(CODE, `client-${i}`, SESSION);
    }
    expect(rooms.attachClient(CODE, 'one-too-many', SESSION)).toEqual({
      ok: false,
      reason: 'SESSION_FULL',
    });
  });

  it('re-attaching the same socket is not counted twice', () => {
    rooms.attachClient(CODE, 'client-0', SESSION);
    expect(rooms.attachClient(CODE, 'client-0', SESSION)).toEqual({ ok: true });
  });
});

describe('detach', () => {
  it('reports the room as emptied only when the last peer leaves', () => {
    rooms.attachHost(CODE, 'sock-1', TECH_A, SESSION);
    rooms.attachClient(CODE, 'client-1', SESSION);

    const first = rooms.detach('client-1');
    expect(first?.emptied).toBe(false);

    const last = rooms.detach('sock-1');
    expect(last?.emptied).toBe(true);
    expect(last?.sessionId).toBe(SESSION);
  });

  it('returns null for a socket it never saw', () => {
    expect(rooms.detach('ghost')).toBeNull();
  });

  it('drops the room once it empties', () => {
    rooms.attachHost(CODE, 'sock-1', TECH_A, SESSION);
    rooms.detach('sock-1');
    expect(rooms.size()).toBe(0);
  });
});
