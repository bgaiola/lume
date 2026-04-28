import { type AuthSession } from '@lume/protocol';
import { useMutation } from '@tanstack/react-query';
import { createRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { z } from 'zod';

import { Route as RootRoute } from './__root';

import { ApiClientError, apiRequest } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';


const searchSchema = z.object({
  token: z.string().optional(),
});

function AuthCallbackPage() {
  const { token } = useSearch({ from: Route.id });
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const startedRef = useRef(false);

  const exchange = useMutation({
    mutationFn: (input: { token: string }) =>
      apiRequest<AuthSession>('/auth/magic-link/callback', {
        method: 'POST',
        body: input,
      }),
    onSuccess: (session) => {
      setSession(session);
      void navigate({ to: '/dashboard' });
    },
  });

  useEffect(() => {
    if (!token || startedRef.current) {
      return;
    }
    startedRef.current = true;
    exchange.mutate({ token });
  }, [token, exchange]);

  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center text-center">
        <div className="space-y-2">
          <p className="font-medium">Enlace no válido.</p>
          <p className="text-sm text-muted-foreground">
            Solicita uno nuevo desde la pantalla de acceso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center text-center">
      <div className="space-y-2">
        {exchange.error ? (
          <>
            <p className="font-medium text-destructive">No se pudo iniciar sesión.</p>
            <p className="text-sm text-muted-foreground">
              {exchange.error instanceof ApiClientError
                ? exchange.error.message
                : 'Pide un enlace nuevo desde la pantalla de acceso.'}
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">Iniciando sesión...</p>
        )}
      </div>
    </div>
  );
}

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/auth/callback',
  validateSearch: searchSchema,
  component: AuthCallbackPage,
});
