/**
 * Codec preference helper.
 *
 * Screen-share content (large flat regions, sharp text, low motion) is
 * notably better served by VP9 than VP8 or H.264: at the same perceptual
 * quality VP9 typically uses 30 to 50% less bitrate on this kind of
 * source. We still keep VP8 and H.264 in the preference list as
 * fallbacks for receivers that lack VP9 hardware decoding.
 */

export type LumePreferredCodec = 'AV1' | 'VP9' | 'VP8' | 'H264';

export const DEFAULT_VIDEO_CODEC_PREFERENCE: readonly LumePreferredCodec[] = [
  'VP9',
  'VP8',
  'H264',
] as const;

const MIME_BY_CODEC: Record<LumePreferredCodec, string> = {
  AV1: 'video/AV1',
  VP9: 'video/VP9',
  VP8: 'video/VP8',
  H264: 'video/H264',
};

/**
 * Reorder the codec list on a video transceiver to match `preference`.
 * Codecs not in the preference list keep their original relative order
 * and trail the preferred ones, so receivers without VP9 still negotiate
 * something.
 *
 * Safe to call on browsers that lack `setCodecPreferences` or
 * `getCapabilities`: returns `null` and leaves the transceiver untouched.
 *
 * Returns the codecs actually applied (in order), or `null` when the
 * browser cannot influence codec selection.
 */
export function applyVideoCodecPreference(
  transceiver: RTCRtpTransceiver,
  preference: readonly LumePreferredCodec[] = DEFAULT_VIDEO_CODEC_PREFERENCE,
): RTCRtpCodec[] | null {
  if (typeof transceiver.setCodecPreferences !== 'function') {
    return null;
  }

  type CapabilityGetter = (kind: string) => RTCRtpCapabilities | null;
  const senderCaps =
    (RTCRtpSender as { getCapabilities?: CapabilityGetter }).getCapabilities?.('video') ?? null;
  const receiverCaps =
    (RTCRtpReceiver as { getCapabilities?: CapabilityGetter }).getCapabilities?.('video') ?? null;

  const available = senderCaps?.codecs ?? receiverCaps?.codecs ?? null;
  if (!available || available.length === 0) {
    return null;
  }

  const preferredMimes = preference.map((codec) => MIME_BY_CODEC[codec].toLowerCase());
  const matches = new Map<number, RTCRtpCodec[]>();
  const rest: RTCRtpCodec[] = [];

  for (const codec of available) {
    const idx = preferredMimes.indexOf(codec.mimeType.toLowerCase());
    if (idx === -1) {
      rest.push(codec);
      continue;
    }
    const bucket = matches.get(idx) ?? [];
    bucket.push(codec);
    matches.set(idx, bucket);
  }

  const ordered: RTCRtpCodec[] = [];
  for (let i = 0; i < preference.length; i++) {
    const bucket = matches.get(i);
    if (bucket) {
      ordered.push(...bucket);
    }
  }
  // Always include the rest so renegotiation never ends up with zero
  // codecs in common with a stripped-down receiver.
  ordered.push(...rest);

  try {
    transceiver.setCodecPreferences(ordered);
    return ordered;
  } catch {
    return null;
  }
}
