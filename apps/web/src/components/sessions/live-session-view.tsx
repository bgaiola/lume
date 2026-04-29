import { type JoinSessionResponse } from '@lume/protocol';
import { LumeHost, type LumePeerState } from '@lume/webrtc';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { env } from '@/lib/env';

interface LiveSessionViewProps {
  sessionCode: string;
  accessToken: string;
  /**
   * ICE servers from the API. The host technically does not call
   * /sessions/:code/join (that endpoint is for customers), but the same
   * STUN/TURN config applies. Phase 2 introduces a host-specific
   * /sessions/:id/host bootstrap; for now we pass a sane default.
   */
  iceServers?: JoinSessionResponse['iceServers'];
}

const STATE_COPY: Record<LumePeerState, string> = {
  idle: 'Preparando',
  'signaling-connecting': 'Conectando',
  'awaiting-peer': 'Esperando al cliente',
  negotiating: 'Estableciendo conexión',
  connected: 'En vivo',
  reconnecting: 'Reconectando',
  closed: 'Sesión cerrada',
};

const DEFAULT_ICE_SERVERS: JoinSessionResponse['iceServers'] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
];

export function LiveSessionView({ sessionCode, accessToken, iceServers }: LiveSessionViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hostRef = useRef<LumeHost | null>(null);
  const [state, setState] = useState<LumePeerState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setErrorMessage(null);
    setState('idle');

    const host = new LumeHost({
      signalingUrl: env.signalingUrl,
      accessToken,
      sessionCode,
      iceServers: ((iceServers ?? DEFAULT_ICE_SERVERS) as RTCIceServer[]),
    });
    hostRef.current = host;

    host.on('stateChange', ({ state: peerState }) => {
      setState(peerState);
    });
    host.on('stream', ({ stream }) => {
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        void video.play().catch(() => {
          // Autoplay can be blocked; the user can click the video to start.
        });
      }
    });
    host.on('error', ({ message }) => {
      setErrorMessage(message);
    });
    host.on('disconnect', ({ message }) => {
      setErrorMessage(message ?? null);
      setState('closed');
    });

    void host.connect();

    return () => {
      host.disconnect('user');
      hostRef.current = null;
    };
  }, [sessionCode, accessToken, iceServers]);

  const handleStop = (): void => {
    hostRef.current?.disconnect('user');
  };

  const isConnected = state === 'connected';
  const showVideo = isConnected || state === 'reconnecting';

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`h-full w-full bg-black object-contain ${showVideo ? 'opacity-100' : 'opacity-0'}`}
      />

      {!showVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          {state === 'awaiting-peer' ? (
            <>
              <div className="h-3 w-3 animate-pulse-soft rounded-full bg-primary" aria-hidden />
              <p className="font-medium text-foreground">Esperando al cliente...</p>
              <p className="max-w-md text-center text-sm">
                Comparte el código <span className="font-mono font-semibold text-foreground">{sessionCode}</span>{' '}
                con tu cliente. Cuando entre verás su pantalla aquí.
              </p>
            </>
          ) : (
            <>
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              <p className="text-sm">{STATE_COPY[state]}...</p>
            </>
          )}
        </div>
      )}

      <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs backdrop-blur">
        <span
          aria-hidden
          className={
            isConnected
              ? 'h-2 w-2 rounded-full bg-primary animate-pulse-soft'
              : 'h-2 w-2 rounded-full bg-muted-foreground/60'
          }
        />
        <span className="font-medium">{STATE_COPY[state]}</span>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="absolute bottom-4 left-1/2 max-w-md -translate-x-1/2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      )}

      <div className="absolute bottom-4 right-4">
        <Button variant="destructive" size="sm" onClick={handleStop}>
          Finalizar sesión
        </Button>
      </div>
    </div>
  );
}
