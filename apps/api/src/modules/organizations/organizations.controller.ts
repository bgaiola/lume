import {
  createOrganizationRequestSchema,
  updateOrganizationRequestSchema,
  type AuthenticatedUser,
  type CreateOrganizationRequest,
  type Organization,
  type UpdateOrganizationRequest,
} from '@lume/protocol';
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

import { OrganizationsService } from './organizations.service';

@Controller('organizations')
@UseGuards(AuthGuard)
export class OrganizationsController {
  constructor(private readonly orgs: OrganizationsService) {}

  @Get('me')
  async getMine(@CurrentUser() user: AuthenticatedUser): Promise<Organization> {
    if (!user.organizationId) {
      throw new ForbiddenException('You do not belong to an organization yet');
    }
    return this.orgs.findById(user.organizationId);
  }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createOrganizationRequestSchema))
    body: CreateOrganizationRequest,
  ): Promise<Organization> {
    if (user.organizationId) {
      throw new BadRequestException('You already belong to an organization');
    }
    return this.orgs.createForUser(user.id, body);
  }

  @Patch('me')
  async updateMine(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateOrganizationRequestSchema))
    body: UpdateOrganizationRequest,
  ): Promise<Organization> {
    if (!user.organizationId) {
      throw new ForbiddenException('You do not belong to an organization yet');
    }
    return this.orgs.update(user.organizationId, body);
  }
}
