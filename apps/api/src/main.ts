import 'reflect-metadata';

import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
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

  app.enableCors({
    origin: config.get('apiCorsOrigins', { infer: true }),
    credentials: true,
  });

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.setGlobalPrefix('v1', { exclude: ['health'] });

  app.enableShutdownHooks();

  const port = config.get('apiPort', { infer: true });
  await app.listen(port);

  const url = await app.getUrl();
  // eslint-disable-next-line no-console
  console.warn(`[lume-api] listening on ${url}`);
}

void bootstrap();
