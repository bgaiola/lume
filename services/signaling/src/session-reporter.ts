import { type Logger } from 'pino';

/**
 * Tells the API that a session is over, so the code stops working the moment
 * the call ends instead of lingering until the expiry sweep.
 *
 * Deliberately best effort: signaling must never block or crash because the
 * API is briefly unavailable. The API's own sweep is the backstop, so the
 * worst case of a failure here is a session that closes late, not one that
 * stays open forever.
 */
export interface SessionReporter {
  reportEnded(sessionId: string): Promise<void>;
}

export function createSessionReporter(
  apiBaseUrl: string,
  secret: string,
  log: Logger,
  timeoutMs = 3_000,
): SessionReporter {
  const endpoint = `${apiBaseUrl.replace(/\/$/, '')}/v1/sessions/internal/ended`;

  return {
    async reportEnded(sessionId: string): Promise<void> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-lume-signaling-secret': secret,
          },
          body: JSON.stringify({ sessionId }),
          signal: controller.signal,
        });
        if (!res.ok) {
          log.warn({ sessionId, status: res.status }, 'API refused the session-ended report');
          return;
        }
        log.info({ sessionId }, 'reported session ended');
      } catch (err) {
        log.warn({ sessionId, err }, 'could not report session ended, sweep will catch it');
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

/** No-op reporter for tests and for running signaling without an API. */
export const nullSessionReporter: SessionReporter = {
  async reportEnded(): Promise<void> {
    /* intentionally does nothing */
  },
};
