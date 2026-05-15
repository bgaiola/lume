import { type BitrateChangePayload, type LumeClient } from '@lume/webrtc';
import { useEffect, useState } from 'react';

interface DebugOverlayProps {
  client: LumeClient;
}

interface DebugSnapshot {
  bitrate: BitrateChangePayload | null;
  codec: string | null;
}

/**
 * Compact dev overlay: live bitrate (from the `bitrateChange` event) and
 * the negotiated outbound video codec (polled once per second from
 * `getStats()`). Gated by `?debug=1` in the URL. Visible only to whoever
 * appends the query parameter, so safe to leave deployed.
 */
export function DebugOverlay({ client }: DebugOverlayProps): JSX.Element {
  const [snapshot, setSnapshot] = useState<DebugSnapshot>({ bitrate: null, codec: null });

  useEffect(() => {
    const offBitrate = client.on('bitrateChange', (payload) => {
      setSnapshot((prev) => ({ ...prev, bitrate: payload }));
    });

    let cancelled = false;
    const pollCodec = async (): Promise<void> => {
      const pc = client.peerConnection;
      if (!pc) {
        return;
      }
      try {
        const report = await pc.getStats();
        let outboundCodecId: string | null = null;
        let codecMime: string | null = null;
        report.forEach((stat: { type?: string; kind?: string; codecId?: string; mimeType?: string; id?: string }) => {
          if (stat.type === 'outbound-rtp' && stat.kind === 'video') {
            outboundCodecId = stat.codecId ?? null;
          }
        });
        if (outboundCodecId) {
          report.forEach((stat: { type?: string; mimeType?: string; id?: string }) => {
            if (stat.type === 'codec' && stat.id === outboundCodecId) {
              codecMime = stat.mimeType ?? null;
            }
          });
        }
        if (!cancelled && codecMime) {
          setSnapshot((prev) => ({ ...prev, codec: codecMime }));
        }
      } catch {
        // Ignore: peer might not be ready yet.
      }
    };
    void pollCodec();
    const interval = setInterval(() => void pollCodec(), 1000);

    return () => {
      offBitrate();
      cancelled = true;
      clearInterval(interval);
    };
  }, [client]);

  const mbps = snapshot.bitrate ? (snapshot.bitrate.bps / 1_000_000).toFixed(2) : '...';
  const reason = snapshot.bitrate?.reason ?? '...';
  const loss = snapshot.bitrate?.lossFraction;
  const rtt = snapshot.bitrate?.rttMs;

  return (
    <div className="fixed right-3 top-3 z-50 rounded-lg border border-white/10 bg-black/70 px-3 py-2 font-mono text-xs leading-relaxed text-white backdrop-blur-sm">
      <div>
        <span className="text-white/50">codec </span>
        <span>{snapshot.codec ?? '...'}</span>
      </div>
      <div>
        <span className="text-white/50">bitrate </span>
        <span>{mbps} Mbps</span>
        <span className="ml-2 text-white/50">{reason}</span>
      </div>
      <div>
        <span className="text-white/50">loss </span>
        <span>{loss === null || loss === undefined ? '...' : `${(loss * 100).toFixed(2)}%`}</span>
        <span className="ml-2 text-white/50">rtt </span>
        <span>{rtt === null || rtt === undefined ? '...' : `${Math.round(rtt)}ms`}</span>
      </div>
    </div>
  );
}

