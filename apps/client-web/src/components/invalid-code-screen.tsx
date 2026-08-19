import { RotateCcw } from 'lucide-react';

import { LumeMark } from './lume-mark';

interface InvalidCodeScreenProps {
  message?: string;
  /** Retries the lookup. Offered only when retrying could actually help. */
  onRetry?: () => void;
}

export function InvalidCodeScreen({ message, onRetry }: InvalidCodeScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      <LumeMark size={96} />
      <div className="max-w-md space-y-2">
        <p className="font-display text-3xl italic">Sesión no encontrada.</p>
        <p className="text-sm text-muted-foreground">
          {message ?? 'Comprueba con tu técnico que el código es correcto y vuelve a intentarlo.'}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-lime px-6 py-2.5 text-sm font-semibold text-surface-deep transition-transform hover:scale-[1.02]"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Volver a intentarlo
          </button>
        )}
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-lg border border-line bg-surface-elev px-6 py-2.5 text-sm font-medium transition-colors hover:border-line-bright hover:bg-surface-hover"
        >
          Escribir otro código
        </a>
      </div>
    </div>
  );
}
