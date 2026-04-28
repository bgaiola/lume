import { type ListSessionsResponse, type Session } from '@lume/protocol';
import { useQuery } from '@tanstack/react-query';
import { Link, createRoute, redirect } from '@tanstack/react-router';
import { Plus } from 'lucide-react';

import { Route as RootRoute } from './__root';

import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';


const STATUS_LABEL: Record<Session['status'], string> = {
  PENDING: 'Esperando',
  ACTIVE: 'Activa',
  ENDED: 'Finalizada',
  CANCELLED: 'Cancelada',
};

const STATUS_TONE: Record<Session['status'], string> = {
  PENDING: 'bg-primary/15 text-primary',
  ACTIVE: 'bg-primary/25 text-primary',
  ENDED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-destructive/15 text-destructive',
};

function DashboardPage() {
  const accessToken = useAuthStore((s) => s.accessToken);

  const { data, isPending, error } = useQuery({
    queryKey: ['sessions', 'list'],
    queryFn: () =>
      apiRequest<ListSessionsResponse>('/sessions?limit=20', { token: accessToken }),
  });

  return (
    <AppShell>
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl italic">Sesiones</h1>
            <p className="text-sm text-muted-foreground">
              Inicia una sesión nueva o continúa una en curso.
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/session/new">
              <Plus className="h-4 w-4" />
              Nueva sesión
            </Link>
          </Button>
        </header>

        {isPending && <p className="text-sm text-muted-foreground">Cargando sesiones...</p>}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            No se han podido cargar las sesiones.
          </p>
        )}

        {data && data.sessions.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="font-medium">Aún no tienes sesiones.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea la primera y compártela con tu cliente.
            </p>
          </div>
        )}

        {data && data.sessions.length > 0 && (
          <ul className="flex flex-col gap-3">
            {data.sessions.map((session) => (
              <li key={session.id}>
                <Link
                  to="/session/$code"
                  params={{ code: session.code }}
                  className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
                >
                  <span className="font-mono text-lg font-semibold tracking-widest">
                    {session.code}
                  </span>
                  <span className="flex-1 text-sm text-muted-foreground">
                    {session.clientName ?? 'Sin nombre de cliente'}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      STATUS_TONE[session.status],
                    )}
                  >
                    {STATUS_LABEL[session.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/dashboard',
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated()) {
      throw redirect({ to: '/login' });
    }
  },
  component: DashboardPage,
});
