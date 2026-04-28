/**
 * Generic, framework-agnostic helper types shared across the Lume monorepo.
 */

/** A value that may be present, absent, or asynchronously resolved. */
export type Maybe<T> = T | null | undefined;

/** A discriminated result type for operations that can fail without throwing. */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/** ISO-8601 date string. Use this for transport, not Date instances. */
export type IsoDateString = string & { readonly __brand: 'IsoDateString' };

/** A cuid produced by Prisma `@default(cuid())`. */
export type Cuid = string & { readonly __brand: 'Cuid' };
