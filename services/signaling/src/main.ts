import { createServer } from 'node:http';

import { type SignalingErrorEvent, SIGNALING_EVENTS } from '@lume/protocol';
import { Server, type Socket } from 'socket.io';

import { authenticatePeer, SignalingAuthError } from './auth';
import { loadConfig } from './config';
import { registerSocketHandlers } from './handlers';
import { loadEnv } from './load-env';
import { createLogger } from './logger';
import { RoomRegistry } from './rooms';
import { createSessionReporter } from './session-reporter';

loadEnv();

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const log = createLogger(config);

  const httpServer = createServer((req, res) => {
    if (req.url === '/health') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(
        JSON.stringify({
          status: 'ok',
          service: 'lume-signaling',
          timestamp: new Date().toISOString(),
        }),
      );
      return;
    }
    res.statusCode = 404;
    res.end();
  });

  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigins,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  const rooms = new RoomRegistry(log.child({ component: 'rooms' }));
  const reporter = createSessionReporter(
    config.apiBaseUrl,
    config.webhookSecret,
    log.child({ component: 'session-reporter' }),
  );

  io.use((socket: Socket, next) => {
    try {
      const peer = authenticatePeer(socket.handshake.auth, config.jwtSecret);
      socket.data.peer = peer;
      next();
    } catch (e) {
      if (e instanceof SignalingAuthError) {
        log.warn(
          { socketId: socket.id, code: e.code, message: e.message },
          'rejecting unauthenticated socket',
        );
        const err = new Error(e.message);
        // Socket.io serializes Error.message into the connect_error payload
        // which the client SDK surfaces in user-friendly form.
        err.name = e.code;
        next(err);
        return;
      }
      log.error({ err: e }, 'unexpected error during handshake');
      next(new Error('internal'));
    }
  });

  io.on('connection', (socket: Socket) => {
    try {
      registerSocketHandlers(io, socket, rooms, log, reporter);
    } catch (e) {
      log.error(
        { err: e, socketId: socket.id },
        'failed to register socket handlers',
      );
      const event: SignalingErrorEvent = {
        code: 'INTERNAL',
        message: 'internal signaling error',
      };
      socket.emit(SIGNALING_EVENTS.error, event);
      socket.disconnect(true);
    }
  });

  httpServer.listen(config.port, () => {
    log.info(
      { port: config.port, corsOrigins: config.corsOrigins },
      'lume-signaling listening',
    );
  });

  const shutdown = (signal: string): void => {
    log.info({ signal, openRooms: rooms.size() }, 'shutting down');
    io.close(() => {
      httpServer.close(() => {
        process.exit(0);
      });
    });
    setTimeout(() => process.exit(1), 5_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('lume-signaling bootstrap failed', err);
  process.exit(1);
});
