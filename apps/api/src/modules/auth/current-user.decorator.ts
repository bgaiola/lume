import { type AuthenticatedUser } from '@lume/protocol';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { type RequestWithUser } from './auth.guard';

/**
 * Resolves the {@link AuthenticatedUser} attached to the request by
 * {@link AuthGuard}. Throws if used on a route without the guard.
 */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    if (!req.user) {
      throw new Error('CurrentUser decorator used on a route that is not protected by AuthGuard');
    }
    return req.user;
  },
);
