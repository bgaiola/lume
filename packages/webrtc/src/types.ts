import { type SignalingErrorEvent } from '@lume/protocol';

export type LumeIceServer = RTCIceServer;

/**
 * Reasons a Lume session ended. Surfaced both on `LumeHost.disconnect`
 * lifecycle events and on `LumeClient` end states.
 */
export type LumeDisconnectReason =
  | 'user'
  | 'host-left'
  | 'client-left'
  | 'media-revoked'
  | 'signaling-error'
  | 'ice-failed'
  | 'unknown';

/** Connection state a single peer link can be in. */
export type LumePeerState =
  | 'idle'
  | 'signaling-connecting'
  | 'awaiting-peer'
  | 'negotiating'
  | 'connected'
  | 'reconnecting'
  | 'closed';

export interface LumeSdkError {
  code: SignalingErrorEvent['code'] | 'NETWORK' | 'UNEXPECTED';
  message: string;
  cause?: unknown;
}
