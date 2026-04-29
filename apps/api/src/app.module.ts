import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { appConfigLoader } from './common/config/app.config';
import { LoggerModule } from './common/logger/logger.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
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
    LoggerModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    SessionsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
