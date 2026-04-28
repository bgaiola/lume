import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { type AppConfig } from '../../common/config/app.config';

import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { MagicLinkService } from './magic-link.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        secret: config.get('jwtSecret', { infer: true }),
        signOptions: {
          expiresIn: config.get('jwtAccessTtl', { infer: true }),
          issuer: 'lume-api',
        },
      }),
      global: true,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailService, MagicLinkService, AuthGuard],
  exports: [AuthService, AuthGuard, JwtModule],
})
export class AuthModule {}
