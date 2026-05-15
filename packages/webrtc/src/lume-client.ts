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

import {
  AdaptiveBitrateController,
  type AdaptiveBitrateConfig,
  type BitrateChangePayload,
} from './adaptive-bitrate';
import {
  applyVideoCodecPreference,
  DEFAULT_VIDEO_CODEC_PREFERENCE,
  type LumePreferredCodec,
} from './codec-preference';
import { TypedEmitter } from './events';
import {
  type LumeDisconnectReason,
  type LumeIceServer,
  type LumePeerState,
  type LumeSdkError,
} from './types';

export interface LumeClientOptions {
  signalingUrl: string;
  joinToken: string;
  sessionCode: string;
  iceServers: LumeIceServer[];
  stream: MediaStream;
  /** Hard cap on Socket.io reconnection attempts. Defaults to 5. */
  reconnectionAttempts?: number;
  /**
   * Adaptive bitrate configuration. Pass `false` to disable the control
   * loop and fall back to a fixed cap at `maxBps` (or 4 Mbps if not set).
   * Pass a partial config to override individual knobs while keeping the
   * rest of the sensible defaults.
   */
  adaptiveBitrate?: Partial<AdaptiveBitrateConfig> | false;
  /**
   * Codec preference order applied to the outgoing video transceiver.
   * Defaults to VP9, VP8, H264 (best for screen-share content first).
   * Pass `null` to skip codec reordering entirely.
   */
  preferredCodecs?: readonly LumePreferredCodec[] | null;
}

type LumeClientEventMap = {
  stateChange: { state: LumePeerState };
  error: LumeSdkError;
  disconnect: { reason: LumeDisconnectReason; message?: string };
  /** Fired once per connect, after the socket is up but before peer-up. */
  signalingReady: void;
  /**
   * Fired when the adaptive bitrate controller changes the target. UIs
   * can render a debug overlay or a "low bandwidth" indicator from this.
   */
  bitrateChange: BitrateChangePayload;
};

/**
 * Customer side of the WebRTC pipeline. Owns the screen-capture
 * MediaStream, drives the offer/answer with the host, and surfaces a
 * single state change stream the UI can render.
 */
export class LumeClient extends TypedEmitter<LumeClientEventMap> {
  private readonly options: LumeClientOptions;
  private socket: Socket | null = null;
  private peer: RTCPeerConnection | null = null;
  private hostSocketId: string | null = null;
  private mySocketId: string | null = null;
  private state: LumePeerState = 'idle';
  private stopped = false;
  private bitrateController: AdaptiveBitrateController | null = null;

  constructor(options: LumeClientOptions) {
    super();
    this.options = options;
    if (options.adaptiveBitrate !== false) {
      this.bitrateController = new AdaptiveBitrateController(
        options.adaptiveBitrate ?? undefined,
        (payload) => this.emit('bitrateChange', payload),
      );
    }
  }

  /** Current high-level state. Mirrors the last `stateChange` event. */
  get currentState(): LumePeerState {
    return this.state;
  }

  /**
   * Open the signaling connection and arm the WebRTC pipeline. Resolves
   * once the signaling socket is live; the WebRTC negotiation continues
   * asynchronously and is reported via `stateChange` events.
   */
  async connect(): Promise<void> {
    if (this.stopped) {
      throw new Error('LumeClient has been disconnected and cannot reconnect');
    }
    if (this.socket) {
      return;
    }

    this.transition('signaling-connecting');

    this.peer = new RTCPeerConnection({ iceServers: this.options.iceServers });
    let videoSender: RTCRtpSender | null = null;
    for (const track of this.options.stream.getTracks()) {
      const sender = this.peer.addTrack(track, this.options.stream);
      if (track.kind === 'video') {
        videoSender = sender;
      }
      // Detect external permission revocation (e.g. browser-level "Stop sharing").
      track.addEventListener('ended', () => this.disconnect('media-revoked'));
    }

    if (this.options.preferredCodecs !== null) {
      const preference = this.options.preferredCodecs ?? DEFAULT_VIDEO_CODEC_PREFERENCE;
      const videoTransceiver = this.peer
        .getTransceivers()
        .find((t) => t.sender.track?.kind === 'video');
      if (videoTransceiver) {
        applyVideoCodecPreference(videoTransceiver, preference);
      }
    }

    if (this.bitrateController && videoSender) {
      this.bitrateController.start(this.peer, videoSender);
    } else {
      this.applyFallbackBitrate();
    }

    this.peer.oniceconnectionstatechange = () => this.onIceState();
    this.peer.onicecandidate = (event) => this.forwardIceCandidate(event.candidate);

    this.socket = io(this.options.signalingUrl, {
      transports: ['websocket', 'polling'],
      auth: {
        role: 'client',
        token: this.options.joinToken,
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
      if (event.role !== 'host') {
        return;
      }
      this.hostSocketId = event.socketId;
      void this.negotiate();
    });

    this.socket.on(SIGNALING_EVENTS.peerLeft, (event: PeerLeftEvent) => {
      if (event.role === 'host') {
        this.disconnect('host-left');
      }
    });

    this.socket.on(SIGNALING_EVENTS.sdp, (raw: unknown) => this.onSdpMessage(raw));
    this.socket.on(SIGNALING_EVENTS.ice, (raw: unknown) => this.onIceMessage(raw));
  }

  /** Tear down the peer connection and signaling socket. Idempotent. */
  disconnect(reason: LumeDisconnectReason = 'user', message?: string): void {
    if (this.stopped) {
      return;
    }
    this.stopped = true;

    this.bitrateController?.stop();
    for (const track of this.options.stream.getTracks()) {
      track.stop();
    }
    try {
      this.peer?.close();
    } catch {
      // Ignore: already closed.
    }
    this.peer = null;
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

  /**
   * Static cap used only when adaptive bitrate is disabled by the caller.
   * The default ceiling matches the upper bound of the adaptive range so
   * that opting out does not silently reduce headroom.
   */
  private applyFallbackBitrate(): void {
    if (!this.peer) {
      return;
    }
    const cfg = this.options.adaptiveBitrate;
    const cap = cfg ? (cfg.maxBps ?? 4_000_000) : 4_000_000;
    for (const sender of this.peer.getSenders()) {
      const params = sender.getParameters();
      params.encodings = params.encodings?.length
        ? params.encodings.map((encoding) => ({ ...encoding, maxBitrate: cap }))
        : [{ maxBitrate: cap }];
      void sender.setParameters(params).catch(() => {
        // Some browsers reject encoding changes pre-negotiation; ignored.
      });
    }
  }

  private async negotiate(): Promise<void> {
    if (!this.peer || !this.socket || !this.hostSocketId || !this.mySocketId) {
      return;
    }
    this.transition('negotiating');
    try {
      const offer = await this.peer.createOffer();
      await this.peer.setLocalDescription(offer);
      const message: SdpMessage = {
        to: this.hostSocketId,
        from: this.mySocketId,
        description: { type: offer.type as 'offer', sdp: offer.sdp ?? '' },
      };
      this.socket.emit(SIGNALING_EVENTS.sdp, message);
    } catch (err) {
      this.emit('error', { code: 'UNEXPECTED', message: 'offer/setLocalDescription failed', cause: err });
      this.disconnect('ice-failed');
    }
  }

  private onIceState(): void {
    const state = this.peer?.iceConnectionState;
    switch (state) {
      case 'checking':
        this.transition('negotiating');
        break;
      case 'connected':
      case 'completed':
        this.transition('connected');
        break;
      case 'disconnected':
        this.transition('reconnecting');
        // Let WebRTC try to recover on its own. If it does not within the
        // browser-internal grace period, `failed` will fire next.
        break;
      case 'failed':
        try {
          this.peer?.restartIce();
          this.transition('reconnecting');
        } catch {
          this.disconnect('ice-failed');
        }
        break;
      case 'closed':
        if (!this.stopped) {
          this.disconnect('ice-failed');
        }
        break;
      default:
        break;
    }
  }

  private forwardIceCandidate(candidate: RTCIceCandidate | null): void {
    if (!this.socket || !this.hostSocketId || !this.mySocketId) {
      return;
    }
    const message: IceCandidateMessage = {
      to: this.hostSocketId,
      from: this.mySocketId,
      candidate: candidate
        ? (candidate.toJSON() as IceCandidateMessage['candidate'])
        : null,
    };
    this.socket.emit(SIGNALING_EVENTS.ice, message);
  }

  private async onSdpMessage(raw: unknown): Promise<void> {
    const parsed = sdpMessageSchema.safeParse(raw);
    if (!parsed.success || !this.peer) {
      return;
    }
    if (parsed.data.description.type !== 'answer') {
      return;
    }
    try {
      await this.peer.setRemoteDescription(parsed.data.description);
    } catch (err) {
      this.emit('error', { code: 'UNEXPECTED', message: 'setRemoteDescription failed', cause: err });
    }
  }

  private async onIceMessage(raw: unknown): Promise<void> {
    const parsed = iceCandidateMessageSchema.safeParse(raw);
    if (!parsed.success || !parsed.data.candidate || !this.peer) {
      return;
    }
    try {
      await this.peer.addIceCandidate(parsed.data.candidate as RTCIceCandidateInit);
    } catch (err) {
      // ICE candidate races are common; do not fail the session for them.
      this.emit('error', { code: 'UNEXPECTED', message: 'addIceCandidate failed', cause: err });
    }
  }
}
