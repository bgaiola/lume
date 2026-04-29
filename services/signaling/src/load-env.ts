import { existsSync } from 'node:fs';
import path from 'node:path';

import { config } from 'dotenv';

/**
 * Load environment variables from the monorepo root `.env`, falling back
 * to a service-local one if present.
 *
 * Each turbo task runs from its own package directory, so `dotenv/config`
 * (which only looks at process.cwd()) would miss the root file. We
 * explicitly point to both candidates here.
 */
export function loadEnv(): void {
  const candidates = [
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '..', '..', '..', '.env'),
  ];
  for (const file of candidates) {
    if (existsSync(file)) {
      config({ path: file, override: false });
    }
  }
}
