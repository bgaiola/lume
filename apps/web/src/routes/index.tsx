import { createRoute, redirect } from '@tanstack/react-router';

import { Route as RootRoute } from './__root';

import { useAuthStore } from '@/stores/auth-store';


export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/',
  beforeLoad: () => {
    const authed = useAuthStore.getState().isAuthenticated();
    throw redirect({ to: authed ? '/dashboard' : '/login' });
  },
});
