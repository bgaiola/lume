import pino, { type Logger } from 'pino';

import { type SignalingConfig } from './config';

export function createLogger(config: SignalingConfig): Logger {
  const isDev = config.nodeEnv !== 'production';
  return pino({
    name: 'lume-signaling',
    level: config.logLevel,
    transport: isDev
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: true,
            translateTime: 'SYS:HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  });
}
