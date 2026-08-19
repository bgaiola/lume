import { type LumeDisconnectReason } from '@lume/webrtc';
import { RotateCcw } from 'lucide-react';

import { LumeMark } from './lume-mark';

interface EndScreenProps {
  reason: LumeDisconnectReason;
  message?: string;
  /** Restarts the flow. Absent when there is nothing sensible to retry. */
  onRetry?: () => void;
}

/**
 * Whether ending this way is worth offering a retry for.
 *
 * Stopping on purpose is not a failure, so offering "volver a intentarlo"
 * there would be noise. A dropped connection is, and every one of those used
 * to end in a phone call because the screen had no way forward.
 */
const RETRYABLE: ReadonlySet<LumeDisconnectReason> = new Set([
  'signaling-error',
  'ice-failed',
  'unknown',
]);

const REASON_COPY: Record<LumeDisconnectReason, { title: string; subtitle: string }> = {
  user: {
    title: 'Sesión finalizada.',
    subtitle: 'Has detenido la compartición. Puedes cerrar esta pestaña.',
  },
  'host-left': {
    title: 'El técnico ha salido.',
    subtitle: 'La sesión ha terminado. Puedes cerrar esta pestaña.',
  },
  'client-left': {
    title: 'Sesión finalizada.',
    subtitle: 'La compartición se ha detenido.',
  },
  'media-revoked': {
    title: 'Has revocado el permiso.',
    subtitle: 'La compartición se ha detenido. Puedes cerrar esta pestaña.',
  },
  'signaling-error': {
    title: 'La sesión se ha interrumpido.',
    subtitle: 'Ha habido un problema con la conexión.',
  },
  'ice-failed': {
    title: 'No se ha podido establecer la conexión.',
    subtitle: 'Comprueba tu red y vuelve a intentarlo.',
  },
  unknown: {
    title: 'La sesión se ha interrumpido.',
    subtitle: 'Ha habido un problema. Puedes cerrar esta pestaña.',
  },
};

export function EndScreen({ reason, message, onRetry }: EndScreenProps) {
  const copy = REASON_COPY[reason];
  const showRetry = Boolean(onRetry) && RETRYABLE.has(reason);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-12 text-center">
      <LumeMark size={96} />
      <div className="max-w-md space-y-2">
        <p className="font-display text-3xl italic">{copy.title}</p>
        <p className="text-sm text-muted-foreground">{message ?? copy.subtitle}</p>
      </div>
      {showRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-lime px-7 py-3 text-base font-semibold text-surface-deep transition-transform hover:scale-[1.02]"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Volver a intentarlo
        </button>
      )}
      <p className="font-display text-base italic text-muted-foreground">Gracias por usar Lume.</p>
    </div>
  );
}
