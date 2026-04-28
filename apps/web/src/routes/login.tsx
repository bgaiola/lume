import { zodResolver } from '@hookform/resolvers/zod';
import { requestMagicLinkRequestSchema, type RequestMagicLinkRequest } from '@lume/protocol';
import { useMutation } from '@tanstack/react-query';
import { createRoute } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';

import { Route as RootRoute } from './__root';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiClientError, apiRequest } from '@/lib/api';


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
    <div className="flex h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-10 w-10 rounded-md bg-primary" aria-hidden />
          <h1 className="font-display text-4xl italic">Lume</h1>
          <p className="text-sm text-muted-foreground">
            Acceso remoto premium para profesionales.
          </p>
        </div>

        {requestLink.isSuccess ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <p className="font-medium">Revisa tu correo.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Te hemos enviado un enlace de acceso. Caduca en 15 minutos.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@empresa.com"
                {...form.register('email')}
                aria-invalid={form.formState.errors.email ? 'true' : 'false'}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={requestLink.isPending}>
              {requestLink.isPending ? 'Enviando...' : 'Enviar enlace de acceso'}
            </Button>

            {requestLink.error && (
              <p className="text-xs text-destructive" role="alert">
                {requestLink.error instanceof ApiClientError
                  ? requestLink.error.message
                  : 'No se ha podido enviar el enlace. Inténtalo de nuevo.'}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/login',
  component: LoginPage,
});
