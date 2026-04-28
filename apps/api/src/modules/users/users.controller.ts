import { type AuthenticatedUser } from '@lume/protocol';
import { Body, Controller, ForbiddenException, Get, Patch, UseGuards } from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

import { UsersService } from './users.service';

const updateMeSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  avatarUrl: z.string().url().max(2048).optional(),
});
type UpdateMeInput = z.infer<typeof updateMeSchema>;

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateMeSchema)) body: UpdateMeInput,
  ): Promise<AuthenticatedUser> {
    return this.users.update(user.id, body);
  }

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser): Promise<AuthenticatedUser[]> {
    if (!user.organizationId) {
      throw new ForbiddenException('You must belong to an organization to list users');
    }
    return this.users.listForOrganization(user.organizationId);
  }
}
