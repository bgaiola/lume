import { zodResolver } from '@hookform/resolvers/zod';
import {
  desktopNotifyRequestSchema,
  desktopPlatformSchema,
  requestMagicLinkRequestSchema,
  type DesktopNotifyRequest,
  type DesktopNotifyResponse,
  type DesktopPlatform,
  type RequestMagicLinkRequest,
} from '@lume/protocol';
import { useMutation } from '@tanstack/react-query';
import { createRoute } from '@tanstack/react-router';
import { Check, Download } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Route as RootRoute } from './__root';

import { LumeMark } from '@/components/ui/lume-mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiClientError, apiRequest } from '@/lib/api';
import { env } from '@/lib/env';
import { cn } from '@/lib/utils';

interface PlatformCard {
  platform: DesktopPlatform;
  name: string;
  detail: string;
  /** When true, downloads directly. Otherwise the card shows the waitlist form. */
  available: boolean;
  /** File size in MB, only shown when available. */
  sizeMb?: number;
  /** File extension shown next to the size (.dmg, .msi, .AppImage). */
  extension?: string;
}

const PLATFORMS: PlatformCard[] = [
  {
    platform: 'macos-arm64',
    name: 'macOS',
    detail: 'Apple Silicon · M1, M2, M3, M4',
    available: true,
    sizeMb: 2.7,
    extension: '.dmg',
  },
  {
    platform: 'macos-intel',
    name: 'macOS',
    detail: 'Procesador Intel',
    available: false,
  },
  {
    platform: 'windows-x64',
    name: 'Windows',
    detail: 'Windows 10 y 11 · 64 bits',
    available: false,
  },
  {
    platform: 'linux-x64',
    name: 'Linux',
    detail: 'AppImage · 64 bits',
    available: false,
  },
];

function downloadUrl(platform: DesktopPlatform): string {
  return `${env.apiUrl.replace(/\/$/, '')}/v1/downloads/desktop/${platform}`;
}

function LoginPage() {
  const form = useForm<RequestMagicLinkRequest>({
    resolver: zodResolver(requestMagicLinkRequestSchema),
    defaultValues: { email: '' },
  });

  const requestLink = useMutation({
    mutationFn: (input: RequestMagicLinkRequest) =>
      apiRequest<{ ok: true; emailSent: true }>('/auth/magic-link', {
        method: 'POST',
        body: input,
      }),
  });

  const onSubmit = form.handleSubmit((values) => {
    requestLink.mutate(values);
  });

  return (
    <div className="min-h-screen bg-surface-deep px-4 py-12">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-12">
        <header className="flex flex-col items-center gap-3 text-center">
          <LumeMark size={56} />
          <h1 className="font-display text-5xl italic text-ink-primary">Lume</h1>
          <p className="text-sm text-ink-secondary">Acceso remoto premium para profesionales.</p>
        </header>

        <section
          aria-labelledby="login-heading"
          className="rounded-2xl border border-line bg-surface-base p-6"
        >
          <h2 id="login-heading" className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-tertiary">
            Acceso al panel web
          </h2>

          {requestLink.isSuccess ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-ink-primary">
              <Check className="h-4 w-4 text-lime" aria-hidden />
              Revisa tu correo. El enlace caduca en 15 min.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-3 sm:flex-row" noValidate>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@empresa.com"
                className="flex-1"
                {...form.register('email')}
                aria-invalid={form.formState.errors.email ? 'true' : 'false'}
              />
              <Button type="submit" disabled={requestLink.isPending} className="sm:w-56">
                {requestLink.isPending ? 'Enviando...' : 'Enviar enlace de acceso'}
              </Button>
            </form>
          )}

          {form.formState.errors.email && (
            <p className="mt-2 text-xs text-danger">{form.formState.errors.email.message}</p>
          )}
          {requestLink.error && (
            <p className="mt-2 text-xs text-danger" role="alert">
              {requestLink.error instanceof ApiClientError
                ? requestLink.error.message
                : 'No se ha podido enviar el enlace. Inténtalo de nuevo.'}
            </p>
          )}
        </section>

        <section aria-labelledby="downloads-heading" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2
              id="downloads-heading"
              className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-tertiary"
            >
              O baja la aplicación de escritorio
            </h2>
            <span className="font-mono text-[10px] text-ink-tertiary">v0.1.0</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {PLATFORMS.map((p) => (
              <DownloadCard key={p.platform} card={p} />
            ))}
          </div>

          <p className="text-xs text-ink-tertiary">
            Las builds actuales no están firmadas. Tu sistema mostrará un aviso al abrir la app la primera vez.
          </p>
        </section>
      </div>
    </div>
  );
}

function DownloadCard({ card }: { card: PlatformCard }): JSX.Element {
  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 rounded-xl border p-4 transition-colors',
        card.available ? 'border-line bg-surface-base hover:border-line-bright' : 'border-line bg-surface-base/50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium text-ink-primary">{card.name}</div>
          <div className="text-xs text-ink-tertiary">{card.detail}</div>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider',
            card.available ? 'bg-lime/10 text-lime' : 'bg-surface-elev text-ink-tertiary',
          )}
        >
          {card.available ? 'Disponible' : 'Pronto'}
        </span>
      </div>

      {card.available ? (
        <a
          href={downloadUrl(card.platform)}
          download
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-lime px-4 py-2 text-sm font-semibold text-surface-deep shadow-glow-lime transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          <Download className="h-4 w-4" aria-hidden />
          Descargar
          {card.sizeMb && card.extension && (
            <span className="font-mono text-[11px] font-normal opacity-70">
              {card.extension} · {card.sizeMb} MB
            </span>
          )}
        </a>
      ) : (
        <NotifyForm platform={card.platform} />
      )}
    </div>
  );
}

function NotifyForm({ platform }: { platform: DesktopPlatform }): JSX.Element {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<DesktopNotifyRequest>({
    resolver: zodResolver(desktopNotifyRequestSchema),
    defaultValues: { email: '', platform: desktopPlatformSchema.parse(platform) },
  });

  const notify = useMutation({
    mutationFn: (input: DesktopNotifyRequest) =>
      apiRequest<DesktopNotifyResponse>('/downloads/notify', {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => setSubmitted(true),
  });

  if (submitted) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-lime/10 px-3 py-2 text-xs text-lime">
        <Check className="h-3.5 w-3.5" aria-hidden />
        Listo. Te avisamos por correo cuando esté disponible.
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit((values) => notify.mutate(values))}
      className="flex gap-2"
      noValidate
    >
      <Input
        type="email"
        placeholder="tu@empresa.com"
        autoComplete="email"
        className="h-9 flex-1 text-xs"
        aria-label={`Email para avisar sobre ${platform}`}
        {...form.register('email')}
      />
      <button
        type="submit"
        disabled={notify.isPending}
        className="shrink-0 rounded-md border border-line bg-surface-elev px-3 text-xs text-ink-secondary transition-colors hover:border-line-bright hover:bg-surface-hover hover:text-ink-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {notify.isPending ? '...' : 'Avísame'}
      </button>
    </form>
  );
}

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/login',
  component: LoginPage,
});
