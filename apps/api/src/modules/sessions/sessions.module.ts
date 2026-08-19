import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { SessionSweeper } from './session-sweeper.service';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [AuthModule],
  controllers: [SessionsController],
  providers: [SessionsService, SessionSweeper],
  exports: [SessionsService],
})
export class SessionsModule {}
