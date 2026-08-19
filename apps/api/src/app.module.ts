import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { appConfigLoader } from './common/config/app.config';
import { LoggerModule } from './common/logger/logger.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { DownloadsModule } from './modules/downloads/downloads.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Load the monorepo root .env so a single file feeds the API,
      // the signaling service and Vite. A package-local .env (when
      // present) wins because it appears first in the array.
      envFilePath: ['.env', '../../.env'],
      load: [appConfigLoader],
      cache: true,
    }),
    // Rate limiting, applied globally through APP_GUARD below.
    //
    // The public session routes were the exposed surface: with a 5-character
    // code and no limit, the whole code space could be swept in under two
    // days, and every hit handed out Cloudflare TURN credentials billed to us.
    // Routes that need a tighter or looser budget override this with
    // @Throttle on the handler.
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1_000, limit: 5 },
      { name: 'medium', ttl: 60_000, limit: 60 },
    ]),
    LoggerModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    SessionsModule,
    DownloadsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
