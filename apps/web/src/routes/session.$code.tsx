import { type SessionInfoResponse } from '@lume/protocol';
import { useQuery } from '@tanstack/react-query';
import { createRoute, redirect, useParams } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';

import { Route as RootRoute } from './__root';

import { AppShell } from '@/components/layout/app-shell';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';


function SessionLivePage() {
  const { code } = useParams({ from: Route.id });
  const accessToken = useAuthStore((s) => s.accessToken);

  const { data, isPending, error } = useQuery({
    queryKey: ['sessions', 'info', code],
    queryFn: () =>
      apiRequest<SessionInfoResponse>(`/sessions/${code}/info`, { token: accessToken }),
    refetchInterval: 5_000,
  });

  return (
    <AppShell>
      <div className="mx-auto flex h-full max-w-5xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl italic">Sesión {code}</h1>
            <p className="text-sm text-muted-foreground">
              {data ? data.hostName : 'Cargando...'}
              {data?.organizationName ? ` · ${data.organizationName}` : ''}
            </p>
          </div>
          {data && (
            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
              {data.status}
            </span>
          )}
        </header>

        <div className="relative flex-1 overflow-hidden rounded-xl border border-border bg-card">
          {isPending && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              <p className="text-sm">Cargando sesión...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <p className="text-sm text-destructive">No se ha podido cargar la sesión.</p>
            </div>
          )}

          {data && data.status === 'PENDING' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
              <div className="h-3 w-3 animate-pulse-soft rounded-full bg-primary" aria-hidden />
              <p className="font-medium">Esperando al cliente...</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Comparte el código <span className="font-mono font-semibold text-foreground">{code}</span>{' '}
                con tu cliente. Cuando entre verás su pantalla aquí mismo.
              </p>
            </div>
          )}

          {data && data.status === 'ACTIVE' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
              <p className="font-medium">Cliente conectado.</p>
              <p className="max-w-md text-sm text-muted-foreground">
                La negociación WebRTC se conectará en el Bloque 6. Por ahora esto es la vista
                preparada del técnico.
              </p>
            </div>
          )}

          {data && (data.status === 'ENDED' || data.status === 'CANCELLED') && (
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">
                Esta sesión ya no está activa.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/session/$code',
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated()) {
      throw redirect({ to: '/login' });
    }
  },
  component: SessionLivePage,
});
