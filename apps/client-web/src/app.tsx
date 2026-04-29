import { type SessionInfoResponse } from '@lume/protocol';
import { normalizeSessionCode } from '@lume/shared';
import { useEffect, useMemo, useRef, useState } from 'react';


import { EndScreen } from './components/end-screen';
import { InvalidCodeScreen } from './components/invalid-code-screen';
import { SharingScreen } from './components/sharing-screen';
import { WelcomeScreen } from './components/welcome-screen';

import { ApiClientError, fetchSessionInfo, joinSession } from '@/lib/api';
import { env } from '@/lib/env';
import { startScreenShare, type ScreenShareSession, type ScreenShareStatus } from '@/lib/screen-share';

type AppState =
  | { kind: 'loading-info' }
  | { kind: 'invalid-code'; message?: string }
  | { kind: 'welcome'; info: SessionInfoResponse; isStarting: boolean; errorMessage?: string }
  | { kind: 'sharing'; info: SessionInfoResponse; status: ScreenShareStatus }
  | {
      kind: 'ended';
      reason: 'user' | 'host-left' | 'media-revoked' | 'error';
      message?: string;
    };

export function App() {
  const code = useMemo(() => readCodeFromLocation(), []);
  const [state, setState] = useState<AppState>(() =>
    code === null
      ? { kind: 'invalid-code', message: 'El enlace no contiene un código válido.' }
      : { kind: 'loading-info' },
  );
  const sessionRef = useRef<ScreenShareSession | null>(null);

  /* ----------------------------- Load info ----------------------------- */
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

  /* --------------------- Cleanup on unmount ---------------------------- */
  useEffect(() => {
    return () => {
      sessionRef.current?.stop('user');
      sessionRef.current = null;
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

    const session = startScreenShare({
      joinResponse,
      signalingUrl: joinResponse.signalingUrl ?? env.signalingUrl,
      stream,
    });
    sessionRef.current = session;

    session.onStatusChange((status) => {
      if (status.kind === 'ended') {
        setState({ kind: 'ended', reason: status.reason, message: status.message });
        sessionRef.current = null;
        return;
      }
      setState({ kind: 'sharing', info, status });
    });
  };

  const handleStop = (): void => {
    sessionRef.current?.stop('user');
  };

  /* ----------------------------- Render -------------------------------- */
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
    return <SharingScreen info={state.info} status={state.status} onStop={handleStop} />;
  }

  return <EndScreen reason={state.reason} message={state.message} />;
}

/**
 * Extract a normalized session code from `window.location.pathname`.
 * The customer reaches `https://lume.app/<CODE>` so we read the first
 * non-empty path segment.
 */
function readCodeFromLocation(): string | null {
  const segments = window.location.pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return null;
  }
  return normalizeSessionCode(segments[0] as string);
}
