import { type SessionInfoResponse } from '@lume/protocol';
import { Lock, Monitor } from 'lucide-react';

import { LumeMark } from './lume-mark';

interface WelcomeScreenProps {
  info: SessionInfoResponse;
  onStart: () => void;
  isStarting: boolean;
  errorMessage?: string;
}

export function WelcomeScreen({ info, onStart, isStarting, errorMessage }: WelcomeScreenProps) {
  const presenter = info.organizationName ? `${info.hostName} de ${info.organizationName}` : info.hostName;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-12 px-6 py-12">
      <LumeMark size={120} />

      <div className="max-w-lg text-center">
        <p className="font-display text-4xl italic leading-tight sm:text-5xl">
          Estás a punto de compartir tu pantalla con{' '}
          <span className="text-primary not-italic font-sans font-semibold">{presenter}</span>.
        </p>
      </div>

      <div className="grid w-full max-w-md gap-3 text-sm text-muted-foreground">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
          <Monitor aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            Verás un diálogo del navegador para elegir qué pantalla, ventana o pestaña compartir. Puedes finalizar la
            sesión en cualquier momento.
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
          <Lock aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            Solo se transmite lo que tú elijas, en directo y cifrado. Lume no graba la sesión a menos que la persona
            técnica te lo indique y tú lo aceptes.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onStart}
        disabled={isStarting}
        className="group relative inline-flex items-center justify-center rounded-full bg-primary px-10 py-5 text-lg font-semibold text-primary-foreground shadow-lg transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 disabled:opacity-60 hover:scale-[1.02] active:scale-[0.99]"
      >
        {isStarting ? 'Solicitando permiso...' : 'Compartir pantalla'}
      </button>

      {errorMessage && (
        <p role="alert" className="max-w-md text-center text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Sesión <span className="font-mono tracking-widest text-foreground">{info.code}</span>
      </p>
    </div>
  );
}
