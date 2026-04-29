/**
 * Tiny dependency-free typed event emitter.
 *
 * Browsers ship `EventTarget`, but its type signature does not let us
 * type the payload per event name. We need that ergonomics in the SDK
 * so consumers get autocomplete on `lumeClient.on('error', e => …)`.
 */

type Handler<T> = (payload: T) => void;

export class TypedEmitter<EventMap extends Record<string, unknown>> {
  private readonly handlers = new Map<keyof EventMap, Set<Handler<unknown>>>();

  on<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>): () => void {
    let bucket = this.handlers.get(event);
    if (!bucket) {
      bucket = new Set();
      this.handlers.set(event, bucket);
    }
    bucket.add(handler as Handler<unknown>);
    return () => this.off(event, handler);
  }

  off<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>): void {
    this.handlers.get(event)?.delete(handler as Handler<unknown>);
  }

  protected emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const bucket = this.handlers.get(event);
    if (!bucket) {
      return;
    }
    // Snapshot the listener set so handlers that mutate during dispatch
    // (e.g. `off()` themselves) do not skip siblings.
    for (const handler of [...bucket]) {
      try {
        handler(payload);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[lume-webrtc] listener threw', err);
      }
    }
  }

  /** Drop every listener. Useful in cleanup paths. */
  protected clearAllListeners(): void {
    this.handlers.clear();
  }
}
