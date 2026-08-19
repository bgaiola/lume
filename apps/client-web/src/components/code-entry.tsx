import { normalizeSessionCode } from '@lume/shared';
import { ArrowRight } from 'lucide-react';
import { useState, type FormEvent } from 'react';


/**
 * Lets a customer reach their session by typing the code.
 *
 * Until this existed the only way in was clicking the technician's link, so
 * the most ordinary support flow there is, reading the code out over the
 * phone, had no path at all. It also rescues anyone whose link was mangled by
 * a mail client or a chat app.
 */
export function CodeEntry(): JSX.Element {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent): void => {
    e.preventDefault();
    const code = normalizeSessionCode(value);
    if (!code) {
      setError('El código son 5 caracteres. Compruébalo con tu técnico.');
      return;
    }
    window.location.href = `/${code}`;
  };

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-2">
      <label htmlFor="session-code" className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-tertiary">
        ¿Tu técnico te ha dado un código?
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="session-code"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder="ABC12"
          maxLength={8}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={error !== null}
          aria-describedby={error ? 'session-code-error' : undefined}
          className="w-full rounded-lg border border-line bg-surface-base px-4 py-3 font-mono text-lg uppercase tracking-[0.2em] text-ink-primary outline-none transition-colors placeholder:text-ink-tertiary placeholder:tracking-[0.2em] focus:border-lime sm:w-48"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface-elev px-5 py-3 text-sm font-semibold text-ink-primary transition-colors hover:border-line-bright hover:bg-surface-hover"
        >
          Entrar
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
      {error && (
        <p id="session-code-error" role="alert" className="text-xs text-warm">
          {error}
        </p>
      )}
    </form>
  );
}
