import { Cookie } from 'lucide-react';
import { useState } from 'react';

import {
  NON_ESSENTIAL_CATEGORIES,
  hasDecided,
  saveConsent,
  type ConsentCategory,
  type ConsentState,
} from '@/lib/cookie-consent';

/**
 * Aviso de cookies con elección por categorías.
 *
 * No se renderiza si no hay ninguna categoría no necesaria declarada, que es
 * el caso hoy. Así evitamos el patrón de pedir consentimiento para algo que
 * no llegamos a instalar, que la AEPD considera una práctica engañosa.
 */
export function CookieConsentBanner(): JSX.Element | null {
  const [dismissed, setDismissed] = useState(() => hasDecided());
  const [showDetail, setShowDetail] = useState(false);
  const [selection, setSelection] = useState<ConsentState>({});

  if (NON_ESSENTIAL_CATEGORIES.length === 0 || dismissed) {
    return null;
  }

  const decide = (categories: ConsentState): void => {
    saveConsent(categories);
    setDismissed(true);
  };

  const acceptAll = (): void => {
    const all: ConsentState = {};
    for (const c of NON_ESSENTIAL_CATEGORIES) {
      all[c.id] = true;
    }
    decide(all);
  };

  const rejectAll = (): void => {
    const none: ConsentState = {};
    for (const c of NON_ESSENTIAL_CATEGORIES) {
      none[c.id] = false;
    }
    decide(none);
  };

  const toggle = (id: ConsentCategory): void => {
    setSelection((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface-base/95 backdrop-blur"
    >
      <div className="mx-auto max-w-4xl px-6 py-5">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 h-4 w-4 shrink-0 text-lime" aria-hidden />
          <div className="flex-1">
            <p className="text-sm leading-relaxed text-ink-secondary">
              Usamos almacenamiento técnico necesario para que el servicio funcione. Queremos además
              tu permiso para las finalidades que puedes revisar abajo. Puedes cambiar tu decisión
              cuando quieras desde la{' '}
              <a className="text-lime hover:underline" href="/cookies">
                política de cookies
              </a>
              .
            </p>

            {showDetail && (
              <ul className="mt-4 space-y-3">
                {NON_ESSENTIAL_CATEGORIES.map((c) => (
                  <li key={c.id} className="rounded-lg border border-line bg-surface-elev px-4 py-3">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selection[c.id] === true}
                        onChange={() => toggle(c.id)}
                        className="mt-1 h-4 w-4 accent-lime"
                      />
                      <span>
                        <span className="block text-sm font-medium text-ink-primary">{c.label}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-ink-tertiary">
                          {c.description}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={acceptAll}
                className="rounded-lg bg-lime px-5 py-2 text-sm font-semibold text-surface-deep transition-transform hover:scale-[1.02]"
              >
                Aceptar todas
              </button>
              <button
                type="button"
                onClick={rejectAll}
                className="rounded-lg border border-line bg-surface-elev px-5 py-2 text-sm font-medium text-ink-primary transition-colors hover:border-line-bright hover:bg-surface-hover"
              >
                Rechazar
              </button>
              {showDetail ? (
                <button
                  type="button"
                  onClick={() => decide(selection)}
                  className="rounded-lg border border-line bg-surface-elev px-5 py-2 text-sm font-medium text-ink-primary transition-colors hover:border-line-bright hover:bg-surface-hover"
                >
                  Guardar mi elección
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDetail(true)}
                  className="rounded-lg px-5 py-2 text-sm font-medium text-ink-tertiary transition-colors hover:text-ink-primary"
                >
                  Configurar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
