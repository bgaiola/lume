import {
  controlEventSchema,
  iceCandidateMessageSchema,
  sdpMessageSchema,
  SIGNALING_EVENTS,
  type ControlEvent,
  type IceCandidateMessage,
  type PeerJoinedEvent,
  type PeerLeftEvent,
  type SdpMessage,
  type SignalingErrorEvent,
} from '@lume/protocol';
import { type Logger } from 'pino';
import { type Server, type Socket } from 'socket.io';
import { type DefaultEventsMap } from 'socket.io/dist/typed-events';

import { type AuthenticatedPeer } from './auth';
import { type RoomRegistry } from './rooms';

interface SocketData {
  peer: AuthenticatedPeer;
}

type SignalingSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;

const PSEUDO_SESSION_ID = 'pending';

/**
 * Wire a freshly authenticated socket into the signaling lifecycle:
 * room attachment, peer presence notifications, and message relays.
 */
export function registerSocketHandlers(
  io: Server,
  socket: SignalingSocket,
  rooms: RoomRegistry,
  log: Logger,
): void {
  const peer = socket.data.peer;
  const sessionCode = peer.sessionCode;
  const sessionId = peer.role === 'client' ? peer.sessionId : PSEUDO_SESSION_ID;

  void socket.join(sessionCode);

  if (peer.role === 'host') {
    const previous = rooms.attachHost(sessionCode, socket.id);
    if (previous) {
      io.sockets.sockets.get(previous)?.disconnect(true);
    }
  } else {
    rooms.attachClient(sessionCode, socket.id);
  }

  log.info(
    { socketId: socket.id, role: peer.role, sessionCode },
    'peer joined session',
  );

  // Notify everyone already in the room (i.e. the other peer) that a new
  // peer has joined. Each peer needs the other peer's socket.id to address
  // SDP and ICE messages directly.
  const peerJoined: PeerJoinedEvent = {
    role: peer.role,
    socketId: socket.id,
    sessionId: sessionId as PeerJoinedEvent['sessionId'],
  };
  socket.to(sessionCode).emit(SIGNALING_EVENTS.peerJoined, peerJoined);

  // Tell the new peer about every existing peer in the room so it knows
  // who to negotiate with without waiting for a fresh `peer:joined`.
  const room = rooms.ensure(sessionCode);
  const existing: PeerJoinedEvent[] = [];
  if (peer.role !== 'host' && room.hostSocketId) {
    existing.push({
      role: 'host',
      socketId: room.hostSocketId,
      sessionId: sessionId as PeerJoinedEvent['sessionId'],
    });
  }
  if (peer.role === 'host') {
    for (const clientId of room.clientSocketIds) {
      existing.push({
        role: 'client',
        socketId: clientId,
        sessionId: sessionId as PeerJoinedEvent['sessionId'],
      });
    }
  }
  for (const event of existing) {
    socket.emit(SIGNALING_EVENTS.peerJoined, event);
  }

  /* --------------------------- SDP relay --------------------------- */

  socket.on(SIGNALING_EVENTS.sdp, (raw: unknown) => {
    const parsed = sdpMessageSchema.safeParse(raw);
    if (!parsed.success) {
      sendError(socket, 'INVALID_TOKEN', 'malformed SDP message');
      return;
    }
    const message: SdpMessage = { ...parsed.data, from: socket.id };
    const target = io.sockets.sockets.get(message.to);
    if (!target || rooms.roomForSocket(message.to)?.sessionCode !== sessionCode) {
      sendError(socket, 'PEER_NOT_FOUND', 'target peer is not in this session');
      return;
    }
    target.emit(SIGNALING_EVENTS.sdp, message);
  });

  /* --------------------------- ICE relay --------------------------- */

  socket.on(SIGNALING_EVENTS.ice, (raw: unknown) => {
    const parsed = iceCandidateMessageSchema.safeParse(raw);
    if (!parsed.success) {
      sendError(socket, 'INVALID_TOKEN', 'malformed ICE message');
      return;
    }
    const message: IceCandidateMessage = { ...parsed.data, from: socket.id };
    const target = io.sockets.sockets.get(message.to);
    if (!target || rooms.roomForSocket(message.to)?.sessionCode !== sessionCode) {
      sendError(socket, 'PEER_NOT_FOUND', 'target peer is not in this session');
      return;
    }
    target.emit(SIGNALING_EVENTS.ice, message);
  });

  /* ------------------------- Control relay ------------------------ */

  socket.on(SIGNALING_EVENTS.control, (raw: unknown) => {
    const parsed = controlEventSchema.safeParse(raw);
    if (!parsed.success) {
      sendError(socket, 'INVALID_TOKEN', 'malformed control event');
      return;
    }
    // Only the host should send control events to the client. We forward to
    // every other peer in the room. Multi-technician multiplexing comes in
    // Phase 2 with proper role-based routing.
    if (peer.role !== 'host') {
      sendError(socket, 'INVALID_TOKEN', 'only the host may emit control events');
      return;
    }
    const event: ControlEvent = parsed.data;
    socket.to(sessionCode).emit(SIGNALING_EVENTS.control, event);
  });

  /* --------------------------- Lifecycle --------------------------- */

  socket.on('disconnect', (reason) => {
    const detached = rooms.detach(socket.id);
    log.info(
      {
        socketId: socket.id,
        role: detached?.role ?? 'unknown',
        sessionCode,
        reason,
      },
      'peer disconnected',
    );
    if (!detached) {
      return;
    }
    const peerLeft: PeerLeftEvent = {
      role: detached.role,
      socketId: socket.id,
    };
    io.to(sessionCode).emit(SIGNALING_EVENTS.peerLeft, peerLeft);
  });
}

function sendError(
  socket: SignalingSocket,
  code: SignalingErrorEvent['code'],
  message: string,
): void {
  const event: SignalingErrorEvent = { code, message };
  socket.emit(SIGNALING_EVENTS.error, event);
}
