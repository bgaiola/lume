import { createRouter } from '@tanstack/react-router';

import { Route as RootRoute } from './routes/__root';
import { Route as AuthCallbackRoute } from './routes/auth.callback';
import { Route as DashboardRoute } from './routes/dashboard';
import { Route as IndexRoute } from './routes/index';
import { Route as LoginRoute } from './routes/login';
import { Route as SessionLiveRoute } from './routes/session.$code';
import { Route as SessionNewRoute } from './routes/session.new';

const routeTree = RootRoute.addChildren([
  IndexRoute,
  LoginRoute,
  AuthCallbackRoute,
  DashboardRoute,
  SessionNewRoute,
  SessionLiveRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
