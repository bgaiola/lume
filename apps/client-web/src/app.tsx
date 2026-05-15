import { type SessionInfoResponse } from '@lume/protocol';
import { normalizeSessionCode } from '@lume/shared';
import {
  LumeClient,
  type LumeDisconnectReason,
  type LumePeerState,
} from '@lume/webrtc';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ApiClientError, fetchSessionInfo, joinSession } from '@/lib/api';
import { env } from '@/lib/env';

import { DebugOverlay } from './components/debug-overlay';
import { EndScreen } from './components/end-screen';
import { InvalidCodeScreen } from './components/invalid-code-screen';
import { LandingPage } from './components/landing-page';
import { SharingScreen } from './components/sharing-screen';
import { WelcomeScreen } from './components/welcome-screen';

type AppState =
  | { kind: 'landing' }
  | { kind: 'loading-info' }
  | { kind: 'invalid-code'; message?: string }
  | { kind: 'welcome'; info: SessionInfoResponse; isStarting: boolean; errorMessage?: string }
  | { kind: 'sharing'; info: SessionInfoResponse; state: LumePeerState }
  | {
      kind: 'ended';
      reason: LumeDisconnectReason;
      message?: string;
    };

export function App() {
  const { code, hasPath } = useMemo(() => readCodeFromLocation(), []);
  const debugEnabled = useMemo(() => isDebugEnabled(), []);
  const [activeClient, setActiveClient] = useState<LumeClient | null>(null);
  const [state, setState] = useState<AppState>(() => {
    if (!hasPath) {
      return { kind: 'landing' };
    }
    if (code === null) {
      return { kind: 'invalid-code', message: 'El enlace no contiene un código válido.' };
    }
    return { kind: 'loading-info' };
  });
  const clientRef = useRef<LumeClient | null>(null);

  useEffect(() => {
    if (!code) {
      return;
    }
    let cancelled = false;
    fetchSessionInfo(code)
      .then((info) => {
        if (cancelled) {
          return;
        }
        setState({ kind: 'welcome', info, isStarting: false });
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        const message =
          err instanceof ApiClientError ? err.message : 'No se ha podido cargar la sesión.';
        setState({ kind: 'invalid-code', message });
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  useEffect(() => {
    return () => {
      clientRef.current?.disconnect('user');
      clientRef.current = null;
    };
  }, []);

  const handleStart = async (info: SessionInfoResponse): Promise<void> => {
    setState({ kind: 'welcome', info, isStarting: true });

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: false,
      });
    } catch (err) {
      const message =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Has cancelado la compartición. Pulsa de nuevo cuando quieras intentarlo.'
          : 'No se ha podido acceder a la pantalla.';
      setState({ kind: 'welcome', info, isStarting: false, errorMessage: message });
      return;
    }

    let joinResponse;
    try {
      joinResponse = await joinSession(info.code, {});
    } catch (err) {
      stream.getTracks().forEach((t) => t.stop());
      const message =
        err instanceof ApiClientError ? err.message : 'No se ha podido unir a la sesión.';
      setState({ kind: 'welcome', info, isStarting: false, errorMessage: message });
      return;
    }

    const client = new LumeClient({
      signalingUrl: joinResponse.signalingUrl ?? env.signalingUrl,
      joinToken: joinResponse.joinToken,
      sessionCode: joinResponse.session.code,
      iceServers: joinResponse.iceServers as RTCIceServer[],
      stream,
    });
    clientRef.current = client;
    setActiveClient(client);

    client.on('stateChange', ({ state: peerState }) => {
      setState({ kind: 'sharing', info, state: peerState });
    });
    client.on('disconnect', ({ reason, message }) => {
      setState({ kind: 'ended', reason, message });
      clientRef.current = null;
      setActiveClient(null);
    });

    void client.connect();
  };

  const handleStop = (): void => {
    clientRef.current?.disconnect('user');
  };

  if (state.kind === 'landing') {
    return <LandingPage />;
  }

  if (state.kind === 'loading-info') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-12">
        <p className="text-sm text-muted-foreground">Cargando sesión...</p>
      </div>
    );
  }

  if (state.kind === 'invalid-code') {
    return <InvalidCodeScreen message={state.message} />;
  }

  if (state.kind === 'welcome') {
    return (
      <WelcomeScreen
        info={state.info}
        onStart={() => void handleStart(state.info)}
        isStarting={state.isStarting}
        errorMessage={state.errorMessage}
      />
    );
  }

  if (state.kind === 'sharing') {
    return (
      <>
        <SharingScreen info={state.info} state={state.state} onStop={handleStop} />
        {debugEnabled && activeClient ? <DebugOverlay client={activeClient} /> : null}
      </>
    );
  }

  return <EndScreen reason={state.reason} message={state.message} />;
}

/**
 * Smoke-test affordance: append `?debug=1` to the session URL to render
 * the live bitrate + negotiated codec overlay. No-op for normal users.
 */
function isDebugEnabled(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('debug') === '1';
  } catch {
    return false;
  }
}

/**
 * Distinguishes the apex (`/` → marketing landing) from a session URL
 * (`/<code>` → share flow). Returns `hasPath: false` only for the
 * apex; any other path tries to be a session code.
 */
function readCodeFromLocation(): { code: string | null; hasPath: boolean } {
  const segments = window.location.pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return { code: null, hasPath: false };
  }
  return { code: normalizeSessionCode(segments[0] as string), hasPath: true };
}
