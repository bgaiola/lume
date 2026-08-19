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
 * How to recognise each platform's asset inside a GitHub Release.
 *
 * Matched at runtime instead of hardcoding a filename, because Tauri stamps
 * the version into the name (`Lume_0.1.0_aarch64.dmg`). The pinned names went
 * stale the moment a new version shipped and all three download buttons
 * started 404ing at once, silently, until a customer complained.
 *
 * `macos-intel` has no build yet (the macos-13 runners are unreliable), so it
 * matches nothing and the controller returns a clean 404.
 */
const ASSET_MATCHERS: Record<DesktopPlatform, RegExp | null> = {
  'macos-arm64': /aarch64.*\.dmg$|arm64.*\.dmg$/i,
  'macos-intel': null,
  'windows-x64': /x64.*\.msi$/i,
  'linux-x64': /amd64.*\.AppImage$|x86_64.*\.AppImage$/i,
};

const RELEASES_API = 'https://api.github.com/repos/bgaiola/lume/releases/latest';

/** How long a resolved asset list is reused before asking GitHub again. */
const RELEASE_CACHE_TTL_MS = 10 * 60_000;

interface ReleaseAsset {
  name: string;
  url: string;
}

@Injectable()
export class DownloadsService {
  private readonly logger = new Logger(DownloadsService.name);
  private releaseCache: { assets: ReleaseAsset[]; fetchedAt: number } | null = null;

  /**
   * Resolve a platform to either a local stream or a 302 to a GitHub
   * Release asset, in that order. Returns 'unavailable' only when both
   * sources are empty (which should never happen once a release is
   * published, but lets the controller emit a clean 404 if it does).
   */
  async resolve(platform: DesktopPlatform): Promise<DownloadResolution> {
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

    const url = await this.resolveReleaseAsset(platform);
    return url ? { kind: 'redirect', url } : { kind: 'unavailable' };
  }

  /**
   * Find this platform's asset in the newest GitHub Release.
   *
   * Cached so a burst of downloads does not spend the unauthenticated GitHub
   * rate limit, and so a slow GitHub does not slow the download button.
   */
  private async resolveReleaseAsset(platform: DesktopPlatform): Promise<string | null> {
    const matcher = ASSET_MATCHERS[platform];
    if (!matcher) {
      return null;
    }

    const cached = this.releaseCache;
    const fresh = cached && Date.now() - cached.fetchedAt < RELEASE_CACHE_TTL_MS;
    if (!fresh) {
      const assets = await this.fetchLatestReleaseAssets();
      if (assets) {
        this.releaseCache = { assets, fetchedAt: Date.now() };
      }
    }

    // Serve the stale list rather than nothing when GitHub is unreachable:
    // a slightly old installer beats a dead button.
    const assets = this.releaseCache?.assets ?? [];
    return assets.find((a) => matcher.test(a.name))?.url ?? null;
  }

  private async fetchLatestReleaseAssets(): Promise<ReleaseAsset[] | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    try {
      const res = await fetch(RELEASES_API, {
        headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'lume-api' },
        signal: controller.signal,
      });
      if (!res.ok) {
        this.logger.warn(`GitHub releases responded ${res.status}`);
        return null;
      }
      const body = (await res.json()) as {
        assets?: { name?: string; browser_download_url?: string }[];
      };
      return (body.assets ?? [])
        .filter((a): a is { name: string; browser_download_url: string } =>
          typeof a.name === 'string' && typeof a.browser_download_url === 'string',
        )
        .map((a) => ({ name: a.name, url: a.browser_download_url }));
    } catch (err) {
      this.logger.warn(`could not reach GitHub releases: ${String(err)}`);
      return null;
    } finally {
      clearTimeout(timer);
    }
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
