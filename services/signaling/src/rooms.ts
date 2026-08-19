import { type Logger } from 'pino';

/**
 * In-memory room registry.
 *
 * Rooms are keyed by `sessionCode` rather than `sessionId` because the
 * end-customer flow only carries the code at handshake time. The host
 * also publishes the code (it is what the customer types in the URL),
 * so both peers consistently land in the same room.
 *
 * Phase 1 enforces 1 host + 1 client per room. The data structure already
 * supports multiple clients so Phase 2 multi-technician work is mostly
 * a relay-fanout question.
 */
export interface RoomState {
  sessionCode: string;
  hostSocketId: string | null;
  /** User id of the technician holding the host seat, for takeover checks. */
  hostUserId: string | null;
  clientSocketIds: Set<string>;
  /** Session id, so the room can be reported as ended when it empties. */
  sessionId: string | null;
}

/** Phase 1 is one technician and one customer per room. */
export const MAX_CLIENTS_PER_ROOM = 1;

export type AttachHostResult =
  | { ok: true; evicted: string | null }
  | { ok: false; reason: 'OCCUPIED_BY_ANOTHER_USER' };

export type AttachClientResult = { ok: true } | { ok: false; reason: 'SESSION_FULL' };

export class RoomRegistry {
  private readonly rooms = new Map<string, RoomState>();
  private readonly socketToRoom = new Map<string, string>();

  constructor(private readonly log: Logger) {}

  /** Look up or create the room for a given session code. */
  ensure(sessionCode: string): RoomState {
    let room = this.rooms.get(sessionCode);
    if (!room) {
      room = {
        sessionCode,
        hostSocketId: null,
        hostUserId: null,
        clientSocketIds: new Set(),
        sessionId: null,
      };
      this.rooms.set(sessionCode, room);
    }
    return room;
  }

  /**
   * Attach a host to its room.
   *
   * Reconnecting as the same technician evicts your own stale socket, which is
   * what happens after a network blip. A DIFFERENT technician is refused: this
   * used to overwrite the host seat unconditionally, so a second party could
   * displace the technician mid-session and inherit the customer's screen.
   * Session ownership is already proven by the token (see auth.ts); this is the
   * second lock, on the room itself.
   */
  attachHost(sessionCode: string, socketId: string, hostUserId: string, sessionId: string): AttachHostResult {
    const room = this.ensure(sessionCode);
    if (room.hostUserId !== null && room.hostUserId !== hostUserId) {
      this.log.warn(
        { sessionCode, incumbent: room.hostUserId, challenger: hostUserId },
        'refused host takeover by a different user',
      );
      return { ok: false, reason: 'OCCUPIED_BY_ANOTHER_USER' };
    }
    const previous = room.hostSocketId;
    room.hostSocketId = socketId;
    room.hostUserId = hostUserId;
    room.sessionId = sessionId;
    this.socketToRoom.set(socketId, sessionCode);
    if (previous && previous !== socketId) {
      this.log.warn(
        { sessionCode, previous, current: socketId },
        'host reconnected, evicting its own previous socket',
      );
    }
    return { ok: true, evicted: previous && previous !== socketId ? previous : null };
  }

  /**
   * Attach a customer to its room, refusing once the room is full.
   *
   * The cap existed in the protocol as a SESSION_FULL error code but was never
   * enforced, so any number of peers could sit in a room and receive the
   * presence of everyone else.
   */
  attachClient(sessionCode: string, socketId: string, sessionId: string): AttachClientResult {
    const room = this.ensure(sessionCode);
    if (!room.clientSocketIds.has(socketId) && room.clientSocketIds.size >= MAX_CLIENTS_PER_ROOM) {
      this.log.warn({ sessionCode, socketId }, 'refused client, room already full');
      return { ok: false, reason: 'SESSION_FULL' };
    }
    room.clientSocketIds.add(socketId);
    room.sessionId = room.sessionId ?? sessionId;
    this.socketToRoom.set(socketId, sessionCode);
    return { ok: true };
  }

  /**
   * Remove a socket from whichever room it was attached to. Returns the
   * room state at the moment of disconnection, plus a flag describing the
   * role the socket was playing, so the caller can notify the remaining
   * peer with the right metadata.
   */
  detach(socketId: string): {
    room: RoomState;
    role: 'host' | 'client';
    /** True when this was the last peer, so the session can be closed. */
    emptied: boolean;
    sessionId: string | null;
  } | null {
    const sessionCode = this.socketToRoom.get(socketId);
    if (!sessionCode) {
      return null;
    }
    const room = this.rooms.get(sessionCode);
    this.socketToRoom.delete(socketId);
    if (!room) {
      return null;
    }
    let role: 'host' | 'client';
    if (room.hostSocketId === socketId) {
      room.hostSocketId = null;
      // The seat stays reserved for the same technician until the room is
      // torn down, so a reconnect within the session still wins it back.
      role = 'host';
    } else if (room.clientSocketIds.has(socketId)) {
      room.clientSocketIds.delete(socketId);
      role = 'client';
    } else {
      // Socket was tracked but no longer present in the room. Best effort.
      return null;
    }
    const emptied = !room.hostSocketId && room.clientSocketIds.size === 0;
    const sessionId = room.sessionId;
    if (emptied) {
      this.rooms.delete(sessionCode);
    }
    return { room, role, emptied, sessionId };
  }

  /** Resolve the session code a given socket belongs to. */
  roomForSocket(socketId: string): RoomState | null {
    const sessionCode = this.socketToRoom.get(socketId);
    if (!sessionCode) {
      return null;
    }
    return this.rooms.get(sessionCode) ?? null;
  }

  /** Total number of active rooms. Exposed for diagnostics. */
  size(): number {
    return this.rooms.size;
  }
}
