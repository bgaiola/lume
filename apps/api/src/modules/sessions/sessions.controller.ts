import {
  createSessionRequestSchema,
  joinSessionRequestSchema,
  listSessionsQuerySchema,
  sessionCodeSchema,
  type AuthenticatedUser,
  type CreateSessionRequest,
  type CreateSessionResponse,
  type JoinSessionRequest,
  type JoinSessionResponse,
  type ListSessionsQuery,
  type ListSessionsResponse,
  type SessionInfoResponse,
} from '@lume/protocol';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  /* ------------------------ Authenticated endpoints ----------------------- */

  @Post()
  @UseGuards(AuthGuard)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createSessionRequestSchema))
    body: CreateSessionRequest,
  ): Promise<CreateSessionResponse> {
    return this.sessions.create(user.id, user.organizationId, body);
  }

  @Get()
  @UseGuards(AuthGuard)
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listSessionsQuerySchema)) query: ListSessionsQuery,
  ): Promise<ListSessionsResponse> {
    return this.sessions.list(user.organizationId, user.id, query);
  }

  /* ------------------------------ Public ---------------------------------- */

  @Get(':code/info')
  async info(@Param('code') rawCode: string): Promise<SessionInfoResponse> {
    const code = sessionCodeSchema.parse(rawCode);
    return this.sessions.getPublicInfo(code);
  }

  @Post(':code/join')
  @HttpCode(HttpStatus.OK)
  async join(
    @Param('code') rawCode: string,
    @Body(new ZodValidationPipe(joinSessionRequestSchema)) body: JoinSessionRequest,
  ): Promise<JoinSessionResponse> {
    const code = sessionCodeSchema.parse(rawCode);
    return this.sessions.join(code, body);
  }
}
