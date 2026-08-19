import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Constant-time comparison of two secrets.
 *
 * `timingSafeEqual` throws when the buffers differ in length, and the length
 * itself leaks information, so both sides are hashed to a fixed 32 bytes
 * first. That keeps the comparison constant-time regardless of the input.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a, 'utf8').digest();
  const hb = createHash('sha256').update(b, 'utf8').digest();
  return timingSafeEqual(ha, hb);
}
