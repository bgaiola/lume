import { type SessionInfoResponse } from '@lume/protocol';
import { useQuery } from '@tanstack/react-query';
import { createRoute, redirect, useParams } from '@tanstack/react-router';

import { Route as RootRoute } from './__root';

import { AppShell } from '@/components/layout/app-shell';
import { LiveSessionView } from '@/components/sessions/live-session-view';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

function SessionLivePage() {
  const { code } = useParams({ from: Route.id });
  const accessToken = useAuthStore((s) => s.accessToken);

  const { data } = useQuery({
    queryKey: ['sessions', 'info', code],
    queryFn: () =>
      apiRequest<SessionInfoResponse>(`/sessions/${code}/info`, { token: accessToken }),
    refetchInterval: (query) => (query.state.data?.status === 'PENDING' ? 5_000 : false),
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
          {accessToken && (
            <LiveSessionView sessionCode={code} accessToken={accessToken} />
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
