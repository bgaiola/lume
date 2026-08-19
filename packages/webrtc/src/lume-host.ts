import {
  iceCandidateMessageSchema,
  sdpMessageSchema,
  SIGNALING_EVENTS,
  type IceCandidateMessage,
  type PeerJoinedEvent,
  type PeerLeftEvent,
  type SdpMessage,
  type SignalingErrorEvent,
} from '@lume/protocol';
import { io, type Socket } from 'socket.io-client';

import { TypedEmitter } from './events';
import {
  type LumeDisconnectReason,
  type LumeIceServer,
  type LumePeerState,
  type LumeSdkError,
} from './types';

export interface LumeHostOptions {
  signalingUrl: string;
  /**
   * Session-scoped host credential from `POST /v1/sessions`, NOT the plain API
   * access token. The signaling service refuses the access token now: it says
   * who you are but not which session you are entitled to host, which is what
   * allowed any account to take over a stranger's live session.
   */
  hostToken: string;
  sessionCode: string;
  iceServers: LumeIceServer[];
  reconnectionAttempts?: number;
}

interface RemotePeer {
  socketId: string;
  pc: RTCPeerConnection;
  remoteStream: MediaStream;
}

type LumeHostEventMap = {
  /** Overall connection lifecycle state, summarized across viewers. */
  stateChange: { state: LumePeerState };
  /** Fired once a remote peer (a customer) attaches a media stream. */
  stream: { socketId: string; stream: MediaStream };
  /** Fired when a peer connects (after handshake) but before media arrives. */
  peerJoined: { socketId: string };
  /** Fired when a peer disconnects from the session room. */
  peerLeft: { socketId: string };
  error: LumeSdkError;
  disconnect: { reason: LumeDisconnectReason; message?: string };
  signalingReady: void;
};

/**
 * Technician side of the WebRTC pipeline. Owns the signaling socket and
 * a peer connection per remote viewer. Phase 1 only ever has one viewer
 * (the customer), but the data structure is plural to keep the door open
 * for the Phase 2 multi-technician flow without a rewrite.
 */
export class LumeHost extends TypedEmitter<LumeHostEventMap> {
  private readonly options: LumeHostOptions;
  private socket: Socket | null = null;
  private mySocketId: string | null = null;
  private readonly peers = new Map<string, RemotePeer>();
  private state: LumePeerState = 'idle';
  private stopped = false;

  constructor(options: LumeHostOptions) {
    super();
    this.options = options;
  }

  get currentState(): LumePeerState {
    return this.state;
  }

  /** Returns the active remote streams keyed by client socket id. */
  get remoteStreams(): ReadonlyMap<string, MediaStream> {
    const out = new Map<string, MediaStream>();
    for (const [id, peer] of this.peers) {
      out.set(id, peer.remoteStream);
    }
    return out;
  }

  /**
   * Live RTCPeerConnections, keyed by client socket id. Exposed so the host
   * UI can call `getStats()` for telemetry (latency, fps, bitrate). The map
   * is a snapshot. Do not mutate the connections from outside.
   */
  get peerConnections(): ReadonlyMap<string, RTCPeerConnection> {
    const out = new Map<string, RTCPeerConnection>();
    for (const [id, peer] of this.peers) {
      out.set(id, peer.pc);
    }
    return out;
  }

  async connect(): Promise<void> {
    if (this.stopped) {
      throw new Error('LumeHost has been disconnected and cannot reconnect');
    }
    if (this.socket) {
      return;
    }

    this.transition('signaling-connecting');

    this.socket = io(this.options.signalingUrl, {
      transports: ['websocket', 'polling'],
      auth: {
        role: 'host',
        token: this.options.hostToken,
        sessionCode: this.options.sessionCode,
      },
      reconnectionAttempts: this.options.reconnectionAttempts ?? 5,
      reconnectionDelay: 800,
    });

    this.socket.on('connect', () => {
      this.mySocketId = this.socket?.id ?? null;
      this.transition('awaiting-peer');
      this.emit('signalingReady', undefined);
    });

    this.socket.on('connect_error', (err) => {
      this.emit('error', { code: 'NETWORK', message: err.message, cause: err });
      this.disconnect('signaling-error', err.message);
    });

    this.socket.on(SIGNALING_EVENTS.error, (event: SignalingErrorEvent) => {
      this.emit('error', { code: event.code, message: event.message });
      this.disconnect('signaling-error', event.message);
    });

    this.socket.on(SIGNALING_EVENTS.peerJoined, (event: PeerJoinedEvent) => {
      if (event.role !== 'client') {
        return;
      }
      this.handlePeerJoined(event.socketId);
    });

    this.socket.on(SIGNALING_EVENTS.peerLeft, (event: PeerLeftEvent) => {
      if (event.role === 'client') {
        this.handlePeerLeft(event.socketId);
      }
    });

    this.socket.on(SIGNALING_EVENTS.sdp, (raw: unknown) => this.onSdpMessage(raw));
    this.socket.on(SIGNALING_EVENTS.ice, (raw: unknown) => this.onIceMessage(raw));
  }

  /** Close every peer connection and disconnect from signaling. Idempotent. */
  disconnect(reason: LumeDisconnectReason = 'user', message?: string): void {
    if (this.stopped) {
      return;
    }
    this.stopped = true;

    for (const peer of this.peers.values()) {
      try {
        peer.pc.close();
      } catch {
        // Ignore.
      }
    }
    this.peers.clear();

    this.socket?.disconnect();
    this.socket = null;

    this.transition('closed');
    this.emit('disconnect', { reason, message });
    this.clearAllListeners();
  }

  /* ------------------------------ Internals ----------------------------- */

  private transition(next: LumePeerState): void {
    if (this.state === next) {
      return;
    }
    this.state = next;
    this.emit('stateChange', { state: next });
  }

  private handlePeerJoined(socketId: string): void {
    if (this.peers.has(socketId)) {
      return;
    }

    const pc = new RTCPeerConnection({ iceServers: this.options.iceServers });
    const remoteStream = new MediaStream();
    const peer: RemotePeer = { socketId, pc, remoteStream };

    pc.ontrack = (event) => {
      remoteStream.addTrack(event.track);
      this.emit('stream', { socketId, stream: remoteStream });
      this.transition('connected');
    };

    pc.onicecandidate = (event) => {
      this.forwardIceCandidate(socketId, event.candidate);
    };

    pc.oniceconnectionstatechange = () => {
      switch (pc.iceConnectionState) {
        case 'checking':
          this.transition('negotiating');
          break;
        case 'connected':
        case 'completed':
          this.transition('connected');
          break;
        case 'disconnected':
          this.transition('reconnecting');
          break;
        case 'failed':
          try {
            pc.restartIce();
            this.transition('reconnecting');
          } catch {
            this.tearDownPeer(socketId, 'ice-failed');
          }
          break;
        default:
          break;
      }
    };

    this.peers.set(socketId, peer);
    this.emit('peerJoined', { socketId });
    // The host does not initiate the offer; the customer does. We just
    // wait for an SDP offer for this peer.
  }

  private handlePeerLeft(socketId: string): void {
    this.tearDownPeer(socketId, 'client-left');
  }

  private tearDownPeer(socketId: string, reason: LumeDisconnectReason): void {
    const peer = this.peers.get(socketId);
    if (!peer) {
      return;
    }
    try {
      peer.pc.close();
    } catch {
      // Ignore.
    }
    this.peers.delete(socketId);
    this.emit('peerLeft', { socketId });
    if (reason === 'ice-failed') {
      this.emit('error', { code: 'UNEXPECTED', message: `peer ${socketId} ICE failed` });
    }
    if (this.peers.size === 0) {
      this.transition('awaiting-peer');
    }
  }

  private async onSdpMessage(raw: unknown): Promise<void> {
    const parsed = sdpMessageSchema.safeParse(raw);
    if (!parsed.success) {
      return;
    }
    const message: SdpMessage = parsed.data;
    const peer = this.peers.get(message.from);
    if (!peer) {
      return;
    }

    if (message.description.type === 'offer') {
      try {
        await peer.pc.setRemoteDescription(message.description);
        const answer = await peer.pc.createAnswer();
        await peer.pc.setLocalDescription(answer);
        const reply: SdpMessage = {
          to: message.from,
          from: this.mySocketId ?? '',
          description: { type: answer.type as 'answer', sdp: answer.sdp ?? '' },
        };
        this.socket?.emit(SIGNALING_EVENTS.sdp, reply);
      } catch (err) {
        this.emit('error', { code: 'UNEXPECTED', message: 'host SDP exchange failed', cause: err });
        this.tearDownPeer(message.from, 'ice-failed');
      }
    }
  }

  private async onIceMessage(raw: unknown): Promise<void> {
    const parsed = iceCandidateMessageSchema.safeParse(raw);
    if (!parsed.success || !parsed.data.candidate) {
      return;
    }
    const peer = this.peers.get(parsed.data.from);
    if (!peer) {
      return;
    }
    try {
      await peer.pc.addIceCandidate(parsed.data.candidate as RTCIceCandidateInit);
    } catch (err) {
      this.emit('error', { code: 'UNEXPECTED', message: 'addIceCandidate failed', cause: err });
    }
  }

  private forwardIceCandidate(toSocketId: string, candidate: RTCIceCandidate | null): void {
    if (!this.socket || !this.mySocketId) {
      return;
    }
    const message: IceCandidateMessage = {
      to: toSocketId,
      from: this.mySocketId,
      candidate: candidate
        ? (candidate.toJSON() as IceCandidateMessage['candidate'])
        : null,
    };
    this.socket.emit(SIGNALING_EVENTS.ice, message);
  }
}
