import { createReadStream, existsSync, statSync } from 'node:fs';
import { mkdir, appendFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import { Injectable, Logger } from '@nestjs/common';

export type DesktopPlatform = 'macos-arm64' | 'macos-intel' | 'windows-x64' | 'linux-x64';

export type DownloadResolution =
  | {
      kind: 'local';
      filename: string;
      size: number;
      stream: NodeJS.ReadableStream;
    }
  | {
      kind: 'redirect';
      url: string;
    }
  | {
      kind: 'unavailable';
    };

const STATIC_ROOT = resolve(__dirname, '..', '..', '..', 'public', 'downloads');
const WAITLIST_FILE = resolve(__dirname, '..', '..', '..', 'data', 'waitlist.jsonl');

/**
 * Local filenames the Downloads service serves from disk. These match
 * the targets the desktop bundle pipeline (`apps/desktop`) emits, with
 * a stable name so the URL never has to change.
 */
const LOCAL_FILENAMES: Record<DesktopPlatform, string> = {
  'macos-arm64': 'lume-macos-arm64.dmg',
  'macos-intel': 'lume-macos-intel.dmg',
  'windows-x64': 'lume-windows-x64.msi',
  'linux-x64': 'lume-linux-x64.AppImage',
};

/**
 * Tauri-produced filenames inside a GitHub Release for the
 * `desktop-v*` tag. Used as a fallback when the local mirror is empty
 * (e.g. while we wait for the next CI run to mirror a new build).
 * Names match the assets published by .github/workflows/desktop-release.yml.
 */
const RELEASE_FILENAMES: Record<DesktopPlatform, string> = {
  'macos-arm64': 'Lume_0.1.0_aarch64.dmg',
  // No build for macOS Intel yet (macos-13 runners are unreliable on
  // GitHub Actions); falls through to a clean 404 until we ship one.
  'macos-intel': '',
  'windows-x64': 'Lume_0.1.0_x64_en-US.msi',
  'linux-x64': 'Lume_0.1.0_amd64.AppImage',
};

const RELEASE_BASE_URL = 'https://github.com/bgaiola/lume/releases/latest/download';

@Injectable()
export class DownloadsService {
  private readonly logger = new Logger(DownloadsService.name);

  /**
   * Resolve a platform to either a local stream or a 302 to a GitHub
   * Release asset, in that order. Returns 'unavailable' only when both
   * sources are empty (which should never happen once a release is
   * published, but lets the controller emit a clean 404 if it does).
   */
  resolve(platform: DesktopPlatform): DownloadResolution {
    const localFilename = LOCAL_FILENAMES[platform];
    const localPath = join(STATIC_ROOT, localFilename);
    if (existsSync(localPath)) {
      const stat = statSync(localPath);
      return {
        kind: 'local',
        filename: localFilename,
        size: stat.size,
        stream: createReadStream(localPath),
      };
    }

    const releaseFilename = RELEASE_FILENAMES[platform];
    if (releaseFilename.length > 0) {
      return {
        kind: 'redirect',
        url: `${RELEASE_BASE_URL}/${releaseFilename}`,
      };
    }

    return { kind: 'unavailable' };
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
