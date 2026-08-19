import 'reflect-metadata';

import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { type AppConfig } from './common/config/app.config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app: INestApplication = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService<AppConfig, true>);

  // Security headers. `contentSecurityPolicy` is off because this process
  // only serves JSON: the CSP that matters belongs to the two Vite apps.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));

  app.enableCors({
    origin: config.get('apiCorsOrigins', { infer: true }),
    credentials: true,
  });

  // Trust the proxy in front of us (Cloudflare tunnel) so the rate limiter
  // buckets by the real client IP instead of lumping every request together.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Validation runs per route via `new ZodValidationPipe(schema)` rather
  // than the default NestJS ValidationPipe (which would force a runtime
  // dependency on class-validator). See common/pipes/zod-validation.pipe.ts.
  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('v1', { exclude: ['health'] });

  app.enableShutdownHooks();

  const port = config.get('apiPort', { infer: true });
  await app.listen(port);

  const url = await app.getUrl();
  // eslint-disable-next-line no-console
  console.warn(`[lume-api] listening on ${url}`);
}

void bootstrap();
