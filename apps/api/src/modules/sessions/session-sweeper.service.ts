import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';

import { SessionsService } from './sessions.service';

/** How often to look for sessions that ran past their expiry. */
const SWEEP_INTERVAL_MS = 60_000;

/**
 * Closes sessions that outlived their expiry.
 *
 * The signaling service reports a session as ended the moment its room
 * empties, which covers the normal case. This sweep covers the rest: the API
 * restarted, the signaling service died mid-call, the report was lost, or a
 * customer left the tab open and walked away. Without it those sessions stay
 * ACTIVE forever, keeping a working join code and burning relay budget.
 */
@Injectable()
export class SessionSweeper implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(SessionSweeper.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly sessions: SessionsService) {}

  onModuleInit(): void {
    // `unref` so a pending timer never holds the process open during shutdown.
    this.timer = setInterval(() => void this.runOnce(), SWEEP_INTERVAL_MS);
    this.timer.unref();
    void this.runOnce();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Exposed so a test or an operator can trigger a sweep directly. */
  async runOnce(): Promise<number> {
    try {
      const closed = await this.sessions.sweepExpired();
      if (closed > 0) {
        this.log.log({ closed }, 'closed expired sessions');
      }
      return closed;
    } catch (err) {
      // A failed sweep must never take the API down; the next tick retries.
      this.log.error({ err }, 'session sweep failed');
      return 0;
    }
  }
}
