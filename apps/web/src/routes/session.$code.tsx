import { type IceServers, type SessionInfoResponse } from '@lume/protocol';
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

  // The credential that authorises hosting THIS session, plus the relay
  // servers for our own side of the call. Both are session-scoped and
  // short-lived, so they are fetched here rather than kept in the store.
  const {
    data: credentials,
    isPending: credentialsPending,
    error: credentialsError,
  } = useQuery({
    queryKey: ['sessions', 'host-token', code],
    enabled: Boolean(accessToken),
    queryFn: () =>
      apiRequest<{
        hostToken: string;
        hostTokenExpiresAt: string;
        iceServers: IceServers;
        signalingUrl: string;
      }>(`/sessions/${code}/host-token`, { method: 'POST', token: accessToken }),
    // Re-mint before the credential expires so a long support call does not
    // lose the ability to reconnect.
    staleTime: 5 * 60_000,
    retry: 1,
  });

  return (
    <AppShell>
      <div className="mx-auto flex h-full max-w-6xl flex-col">
        {credentialsError && (
          <div className="m-auto max-w-md rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-center">
            <p className="text-sm font-medium">No se ha podido abrir esta sesión.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Puede que haya caducado o que pertenezca a otro técnico. Crea una nueva sesión para
              seguir.
            </p>
          </div>
        )}
        {credentialsPending && !credentialsError && (
          <p className="m-auto text-sm text-muted-foreground">Preparando la sesión...</p>
        )}
        {credentials && (
          <LiveSessionView
            sessionCode={code}
            hostToken={credentials.hostToken}
            iceServers={credentials.iceServers as never}
            hostName={data?.hostName}
            organizationName={data?.organizationName ?? null}
          />
        )}
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
