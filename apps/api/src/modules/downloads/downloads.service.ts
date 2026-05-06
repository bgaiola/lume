import { createReadStream, existsSync, statSync } from 'node:fs';
import { mkdir, appendFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import { Injectable, Logger, NotFoundException } from '@nestjs/common';

export type DesktopPlatform = 'macos-arm64' | 'macos-intel' | 'windows-x64' | 'linux-x64';

export interface BinaryInfo {
  filename: string;
  size: number;
  stream: NodeJS.ReadableStream;
}

const STATIC_ROOT = resolve(__dirname, '..', '..', '..', 'public', 'downloads');
const WAITLIST_FILE = resolve(__dirname, '..', '..', '..', 'data', 'waitlist.jsonl');

const FILENAMES: Record<DesktopPlatform, string> = {
  'macos-arm64': 'lume-macos-arm64.dmg',
  'macos-intel': 'lume-macos-intel.dmg',
  'windows-x64': 'lume-windows-x64.msi',
  'linux-x64': 'lume-linux-x64.AppImage',
};

@Injectable()
export class DownloadsService {
  private readonly logger = new Logger(DownloadsService.name);

  /**
   * Returns a streamable handle to the requested platform binary, or
   * throws NotFound if no build has been published for that platform.
   * Files live in `apps/api/public/downloads/` (gitignored, hydrated
   * by the desktop bundle pipeline).
   */
  getBinary(platform: DesktopPlatform): BinaryInfo {
    const filename = FILENAMES[platform];
    const path = join(STATIC_ROOT, filename);
    if (!existsSync(path)) {
      throw new NotFoundException({
        code: 'DOWNLOAD_NOT_AVAILABLE',
        message: `No published build for ${platform} yet.`,
      });
    }
    const stat = statSync(path);
    return {
      filename,
      size: stat.size,
      stream: createReadStream(path),
    };
  }

  /**
   * Appends a waitlist entry as one JSONL line. Phase 1 keeps this off
   * the database to avoid a migration; the file is small and append-only.
   */
  async addToWaitlist(email: string, platform: DesktopPlatform): Promise<void> {
    const entry = {
      email: email.toLowerCase().trim(),
      platform,
      createdAt: new Date().toISOString(),
    };
    await mkdir(dirname(WAITLIST_FILE), { recursive: true });
    await appendFile(WAITLIST_FILE, `${JSON.stringify(entry)}\n`, 'utf8');
    this.logger.log(`waitlist: ${entry.email} wants ${entry.platform}`);
  }
}
