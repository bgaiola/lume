import { type SessionInfoResponse } from '@lume/protocol';
import { type LumePeerState } from '@lume/webrtc';
import { Eye, X } from 'lucide-react';

import { LumeMark } from './lume-mark';

interface SharingScreenProps {
  info: SessionInfoResponse;
  state: LumePeerState;
  onStop: () => void;
}

const STATE_COPY: Record<LumePeerState, string> = {
  idle: 'Conectando...',
  'signaling-connecting': 'Conectando con Lume...',
  'awaiting-peer': 'Esperando al técnico...',
  negotiating: 'Estableciendo conexión cifrada...',
  connected: 'está viendo tu pantalla',
  reconnecting: 'Reconectando...',
  closed: 'Sesión cerrada.',
};

export function SharingScreen({ info, state, onStop }: SharingScreenProps) {
  const presenter = info.organizationName ? `${info.hostName} de ${info.organizationName}` : info.hostName;
  const isConnected = state === 'connected';

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-md bg-primary" aria-hidden />
          <span className="font-display text-xl italic">Lume</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Sesión <span className="font-mono tracking-widest text-foreground">{info.code}</span>
        </p>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
        <LumeMark size={120} />

        <div className="text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <span
              aria-hidden
              className={
                isConnected
                  ? 'h-2.5 w-2.5 rounded-full bg-primary animate-pulse-soft'
                  : 'h-2.5 w-2.5 rounded-full bg-muted-foreground/60 animate-pulse-soft'
              }
            />
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {isConnected ? 'En vivo' : 'Preparando'}
            </span>
          </div>
          {isConnected ? (
            <p className="font-display text-4xl italic leading-tight">
              <span className="not-italic font-sans font-semibold text-primary">{presenter}</span>{' '}
              {STATE_COPY[state]}
            </p>
          ) : (
            <p className="font-display text-3xl italic leading-tight">{STATE_COPY[state]}</p>
          )}
        </div>

        {isConnected && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye aria-hidden className="h-4 w-4" />
            Solo se transmite lo que has elegido compartir.
          </p>
        )}
      </main>

      <footer className="flex justify-center px-6 py-8">
        <button
          type="button"
          onClick={onStop}
          className="inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-6 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
        >
          <X aria-hidden className="h-4 w-4" />
          Finalizar compartición
        </button>
      </footer>
    </div>
  );
}
