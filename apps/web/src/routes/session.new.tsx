import { zodResolver } from '@hookform/resolvers/zod';
import {
  createSessionRequestSchema,
  type CreateSessionRequest,
  type CreateSessionResponse,
} from '@lume/protocol';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Route as RootRoute } from './__root';

import { AppShell } from '@/components/layout/app-shell';
import { NewSessionDialog } from '@/components/sessions/new-session-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiClientError, apiRequest } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';


function NewSessionPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [created, setCreated] = useState<CreateSessionResponse | null>(null);

  const form = useForm<CreateSessionRequest>({
    resolver: zodResolver(createSessionRequestSchema),
    defaultValues: { clientName: '' },
  });

  const create = useMutation({
    mutationFn: (input: CreateSessionRequest) =>
      apiRequest<CreateSessionResponse>('/sessions', {
        method: 'POST',
        body: input,
        token: accessToken,
      }),
    onSuccess: (response) => {
      setCreated(response);
      void queryClient.invalidateQueries({ queryKey: ['sessions', 'list'] });
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    create.mutate({
      clientName: values.clientName?.trim() ? values.clientName : undefined,
    });
  });

  const handleJoinAsHost = () => {
    if (!created) {
      return;
    }
    void navigate({ to: '/session/$code', params: { code: created.session.code } });
  };

  return (
    <AppShell>
      <div className="mx-auto flex max-w-xl flex-col gap-8">
        <header>
          <h1 className="font-display text-4xl italic">Nueva sesión</h1>
          <p className="text-sm text-muted-foreground">
            Pon un nombre opcional para identificar al cliente. Generaremos un código corto que
            puedas compartir.
          </p>
        </header>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <label htmlFor="clientName" className="text-sm font-medium">
              Nombre del cliente <span className="text-muted-foreground">(opcional)</span>
            </label>
            <Input
              id="clientName"
              autoFocus
              placeholder="p. ej. María, equipo de ventas"
              {...form.register('clientName')}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="lg" disabled={create.isPending}>
              {create.isPending ? 'Creando...' : 'Crear sesión'}
            </Button>
            <Button type="button" variant="ghost" size="lg" onClick={() => navigate({ to: '/dashboard' })}>
              Cancelar
            </Button>
          </div>

          {create.error && (
            <p className="text-sm text-destructive" role="alert">
              {create.error instanceof ApiClientError
                ? create.error.message
                : 'No se ha podido crear la sesión.'}
            </p>
          )}
        </form>
      </div>

      <NewSessionDialog
        open={created !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreated(null);
          }
        }}
        session={created}
        onJoinAsHost={handleJoinAsHost}
      />
    </AppShell>
  );
}

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/session/new',
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated()) {
      throw redirect({ to: '/login' });
    }
  },
  component: NewSessionPage,
});
