#!/usr/bin/env node
/**
 * Bootstrap the local `.env` file from `.env.example`, replacing the
 * placeholder secrets with cryptographically random values so the API
 * boots out of the box.
 *
 * Idempotent: if `.env` already exists the script exits without doing
 * anything, so re-running it never overwrites real secrets.
 */
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const examplePath = path.join(repoRoot, '.env.example');
const targetPath = path.join(repoRoot, '.env');

if (existsSync(targetPath)) {
  console.warn(`[generate-env] ${targetPath} already exists, leaving it alone.`);
  process.exit(0);
}

if (!existsSync(examplePath)) {
  console.error(`[generate-env] ${examplePath} does not exist.`);
  process.exit(1);
}

const jwtSecret = randomBytes(48).toString('hex');
const magicLinkSecret = randomBytes(48).toString('hex');
const signalingWebhookSecret = randomBytes(32).toString('hex');

const replaced = readFileSync(examplePath, 'utf8')
  .replace('replace_me_with_64_random_hex_chars', jwtSecret)
  .replace('replace_me_with_another_64_random_hex_chars', magicLinkSecret)
  .replace('replace_me_with_32_random_hex_chars', signalingWebhookSecret);

writeFileSync(targetPath, replaced, { mode: 0o600 });
console.warn(`[generate-env] wrote ${targetPath} with fresh JWT and magic-link secrets.`);
console.warn('[generate-env] edit it to set RESEND_API_KEY and other production-only values.');
