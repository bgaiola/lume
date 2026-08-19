import { Copy, Laptop, Check } from 'lucide-react';
import { useState } from 'react';

import { LumeMark } from './lume-mark';

interface UnsupportedBrowserScreenProps {
  /** Session code, shown large so it can be typed on a computer. */
  code: string;
}

/**
 * Shown when the browser cannot share a screen at all.
 *
 * In practice this is every phone and tablet: no mobile browser implements
 * `getDisplayMedia`. The customer used to reach the normal welcome screen,
 * press "Compartir pantalla", and get a generic failure with the button still
 * sitting there inviting another try. And the landing tells the technician to
 * send the link over WhatsApp, which opens on a phone by default, so this was
 * the common path rather than an edge case.
 */
export function UnsupportedBrowserScreen({ code }: UnsupportedBrowserScreenProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/${code}`;

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked on insecure origins and in some in-app browsers.
      // The code is on screen anyway, so this is only a convenience.
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      <LumeMark size={80} />

      <div className="max-w-md space-y-3">
        <p className="font-display text-3xl italic">Abre este enlace en un ordenador.</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Para compartir la pantalla hace falta un ordenador con Windows, macOS o Linux. Los móviles
          y las tabletas no pueden hacerlo.
        </p>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface-base p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-tertiary">
          Tu código
        </p>
        <p className="mt-2 font-mono text-4xl font-semibold tracking-[0.2em] text-lime">{code}</p>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          En el ordenador, entra en{' '}
          <span className="font-medium text-ink-primary">{window.location.host}</span> y escribe este
          código.
        </p>
        <button
          type="button"
          onClick={() => void copy()}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-surface-elev px-4 py-2.5 text-sm font-medium transition-colors hover:border-line-bright hover:bg-surface-hover"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-lime" aria-hidden />
              Enlace copiado
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden />
              Copiar el enlace
            </>
          )}
        </button>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Laptop className="h-3.5 w-3.5" aria-hidden />
        Tu técnico sigue esperando. No hace falta que le avises.
      </p>
    </div>
  );
}

/**
 * Whether this browser can share a screen.
 *
 * Feature detection rather than user-agent sniffing: a desktop browser too old
 * for the API is just as stuck as a phone, and a future mobile browser that
 * implements it should work without a code change here.
 */
export function canShareScreen(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getDisplayMedia === 'function';
}
