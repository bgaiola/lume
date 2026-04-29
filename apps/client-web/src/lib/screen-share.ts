/**
 * End-customer side of the WebRTC + signaling flow.
 *
 * This module is intentionally framework-agnostic so Block 6 can lift it
 * into `packages/webrtc/LumeClient` without touching consumer code beyond
 * the import path. The React layer in src/components/* simply observes
 * status updates via the {@link onStatusChange} callback.
 */

import {
  iceCandidateMessageSchema,
  sdpMessageSchema,
  SIGNALING_EVENTS,
  type IceCandidateMessage,
  type JoinSessionResponse,
  type PeerJoinedEvent,
  type SdpMessage,
  type SignalingErrorEvent,
} from '@lume/protocol';
import { io, type Socket } from 'socket.io-client';

export type ScreenShareStatus =
  | { kind: 'idle' }
  | { kind: 'requesting-media' }
  | { kind: 'connecting' }
  | { kind: 'awaiting-host' }
  | { kind: 'negotiating' }
  | { kind: 'connected' }
  | { kind: 'reconnecting' }
  | { kind: 'ended'; reason: 'user' | 'host-left' | 'media-revoked' | 'error'; message?: string };

export interface StartScreenShareInput {
  joinResponse: JoinSessionResponse;
  signalingUrl: string;
  /** The MediaStream returned by `getDisplayMedia`, attached to the peer. */
  stream: MediaStream;
}

export interface ScreenShareSession {
  /** Stop sharing, close the peer connection, and disconnect from signaling. */
  stop: (reason?: 'user' | 'host-left' | 'media-revoked' | 'error', message?: string) => void;
  onStatusChange: (handler: (status: ScreenShareStatus) => void) => () => void;
}

const RTC_CONFIG_FALLBACK: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export function startScreenShare(input: StartScreenShareInput): ScreenShareSession {
  const { joinResponse, signalingUrl, stream } = input;

  const handlers = new Set<(status: ScreenShareStatus) => void>();
  let status: ScreenShareStatus = { kind: 'connecting' };
  const update = (next: ScreenShareStatus): void => {
    status = next;
    handlers.forEach((h) => h(next));
  };

  const config: RTCConfiguration =
    joinResponse.iceServers.length > 0
      ? { iceServers: joinResponse.iceServers as RTCIceServer[] }
      : RTC_CONFIG_FALLBACK;

  const pc = new RTCPeerConnection(config);
  for (const track of stream.getTracks()) {
    pc.addTrack(track, stream);
  }

  let hostSocketId: string | null = null;
  let mySocketId: string | null = null;
  let stopped = false;

  // The end customer screens are write-only: we send screen tracks but do
  // not consume any. We still listen for ontrack so that Phase 2 audio
  // back-channels (if introduced) work without protocol changes.
  pc.ontrack = (event) => {
    // No-op for Phase 1.
    void event;
  };

  pc.oniceconnectionstatechange = () => {
    switch (pc.iceConnectionState) {
      case 'checking':
        update({ kind: 'negotiating' });
        break;
      case 'connected':
      case 'completed':
        update({ kind: 'connected' });
        break;
      case 'disconnected':
        update({ kind: 'reconnecting' });
        break;
      case 'failed':
        cleanup('error', 'La conexión con el técnico ha fallado.');
        break;
      case 'closed':
        if (status.kind !== 'ended') {
          update({ kind: 'ended', reason: 'error', message: 'Conexión cerrada.' });
        }
        break;
      default:
        break;
    }
  };

  // Watch the screen-capture track itself: if the user revokes permission
  // through the browser UI we want a clean end-of-session.
  const onTrackEnded = (): void => {
    cleanup('media-revoked');
  };
  for (const track of stream.getTracks()) {
    track.addEventListener('ended', onTrackEnded);
  }

  const socket: Socket = io(signalingUrl, {
    transports: ['websocket', 'polling'],
    auth: {
      role: 'client',
      token: joinResponse.joinToken,
      sessionCode: joinResponse.session.code,
    },
    reconnectionAttempts: 5,
    reconnectionDelay: 800,
  });

  socket.on('connect', () => {
    mySocketId = socket.id ?? null;
    update({ kind: 'awaiting-host' });
  });

  socket.on('connect_error', (err) => {
    cleanup('error', err.message || 'No se ha podido conectar al servicio de señalización.');
  });

  socket.on(SIGNALING_EVENTS.error, (event: SignalingErrorEvent) => {
    cleanup('error', event.message);
  });

  socket.on(SIGNALING_EVENTS.peerJoined, (event: PeerJoinedEvent) => {
    if (event.role !== 'host') {
      return;
    }
    hostSocketId = event.socketId;
    void negotiate();
  });

  socket.on(SIGNALING_EVENTS.peerLeft, (event: { role: 'host' | 'client' }) => {
    if (event.role === 'host') {
      cleanup('host-left');
    }
  });

  socket.on(SIGNALING_EVENTS.sdp, (raw: unknown) => {
    const parsed = sdpMessageSchema.safeParse(raw);
    if (!parsed.success) {
      return;
    }
    const message: SdpMessage = parsed.data;
    if (message.description.type === 'answer') {
      void pc.setRemoteDescription(message.description);
    }
  });

  socket.on(SIGNALING_EVENTS.ice, (raw: unknown) => {
    const parsed = iceCandidateMessageSchema.safeParse(raw);
    if (!parsed.success || !parsed.data.candidate) {
      return;
    }
    void pc.addIceCandidate(parsed.data.candidate as RTCIceCandidateInit);
  });

  pc.onicecandidate = (event) => {
    if (!hostSocketId || !mySocketId) {
      return;
    }
    const message: IceCandidateMessage = {
      to: hostSocketId,
      from: mySocketId,
      candidate: event.candidate
        ? (event.candidate.toJSON() as IceCandidateMessage['candidate'])
        : null,
    };
    socket.emit(SIGNALING_EVENTS.ice, message);
  };

  async function negotiate(): Promise<void> {
    if (!hostSocketId || !mySocketId || stopped) {
      return;
    }
    update({ kind: 'negotiating' });
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const message: SdpMessage = {
      to: hostSocketId,
      from: mySocketId,
      description: { type: offer.type as 'offer', sdp: offer.sdp ?? '' },
    };
    socket.emit(SIGNALING_EVENTS.sdp, message);
  }

  function cleanup(
    reason: 'user' | 'host-left' | 'media-revoked' | 'error' = 'user',
    message?: string,
  ): void {
    if (stopped) {
      return;
    }
    stopped = true;
    for (const track of stream.getTracks()) {
      track.removeEventListener('ended', onTrackEnded);
      track.stop();
    }
    try {
      pc.close();
    } catch {
      // Ignore. The peer connection might already be closed.
    }
    socket.disconnect();
    update({ kind: 'ended', reason, message });
  }

  return {
    stop: cleanup,
    onStatusChange: (handler) => {
      handlers.add(handler);
      handler(status);
      return () => {
        handlers.delete(handler);
      };
    },
  };
}
