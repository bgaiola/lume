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
  clientSocketIds: Set<string>;
}

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
        clientSocketIds: new Set(),
      };
      this.rooms.set(sessionCode, room);
    }
    return room;
  }

  /**
   * Attach a host to its room. Returns the previous host socket id, if any,
   * so the caller can disconnect a stale host that reconnected.
   */
  attachHost(sessionCode: string, socketId: string): string | null {
    const room = this.ensure(sessionCode);
    const previous = room.hostSocketId;
    room.hostSocketId = socketId;
    this.socketToRoom.set(socketId, sessionCode);
    if (previous && previous !== socketId) {
      this.log.warn(
        { sessionCode, previous, current: socketId },
        'host reconnected, evicting previous host',
      );
    }
    return previous && previous !== socketId ? previous : null;
  }

  attachClient(sessionCode: string, socketId: string): void {
    const room = this.ensure(sessionCode);
    room.clientSocketIds.add(socketId);
    this.socketToRoom.set(socketId, sessionCode);
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
      role = 'host';
    } else if (room.clientSocketIds.has(socketId)) {
      room.clientSocketIds.delete(socketId);
      role = 'client';
    } else {
      // Socket was tracked but no longer present in the room. Best effort.
      return null;
    }
    if (!room.hostSocketId && room.clientSocketIds.size === 0) {
      this.rooms.delete(sessionCode);
    }
    return { room, role };
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
