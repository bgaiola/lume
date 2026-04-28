/**
 * Alphabet used to generate session codes.
 *
 * Excludes characters that look alike on small UI / over voice / on poorly
 * captured screen recordings: 0/O, 1/I/L. The remaining 32 characters give
 * us 32^5 = 33,554,432 possible codes, which is plenty for Phase 1 and
 * still readable when shared verbally.
 */
export const SESSION_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const SESSION_CODE_LENGTH = 5;

/**
 * Regular expression that matches a well-formed session code.
 * Use {@link isSessionCode} for type-safe checks.
 */
export const SESSION_CODE_REGEX = new RegExp(
  `^[${SESSION_CODE_ALPHABET}]{${SESSION_CODE_LENGTH}}$`,
);

/**
 * A nominal type for session codes so the rest of the codebase can avoid
 * passing arbitrary strings where a validated code is required.
 */
export type SessionCode = string & { readonly __brand: 'SessionCode' };

/**
 * Generate a cryptographically random session code using the Lume alphabet.
 *
 * Uses {@link Crypto.getRandomValues} (available in browsers and Node ≥ 19
 * via `globalThis.crypto`) and rejection-samples to avoid modulo bias.
 * The caller is responsible for handling collisions at the persistence
 * layer (Postgres unique index + retry on conflict).
 */
export function generateSessionCode(): SessionCode {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== 'function') {
    throw new Error(
      'Web Crypto API not available. Lume requires Node ≥ 19 or a modern browser.',
    );
  }

  const alphabetSize = SESSION_CODE_ALPHABET.length;
  // Largest multiple of alphabetSize that fits in a Uint8 (256). Sampling
  // beyond this value produces a biased distribution; we resample instead.
  const acceptThreshold = Math.floor(256 / alphabetSize) * alphabetSize;

  const out: string[] = [];
  const buffer = new Uint8Array(SESSION_CODE_LENGTH * 2);
  while (out.length < SESSION_CODE_LENGTH) {
    cryptoApi.getRandomValues(buffer);
    for (const byte of buffer) {
      if (byte >= acceptThreshold) {
        continue;
      }
      out.push(SESSION_CODE_ALPHABET[byte % alphabetSize] as string);
      if (out.length === SESSION_CODE_LENGTH) {
        break;
      }
    }
  }
  return out.join('') as SessionCode;
}

/**
 * Type guard that narrows a string to {@link SessionCode} when it matches
 * the alphabet and length.
 */
export function isSessionCode(value: string): value is SessionCode {
  return SESSION_CODE_REGEX.test(value);
}

/**
 * Normalize a user-typed code: uppercase and trim whitespace, then validate.
 * Returns null if the result does not match the canonical shape.
 */
export function normalizeSessionCode(input: string): SessionCode | null {
  const candidate = input.trim().toUpperCase();
  return isSessionCode(candidate) ? candidate : null;
}
