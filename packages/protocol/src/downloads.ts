import { z } from 'zod';

import { emailSchema } from './common';

/**
 * Platforms the desktop bundle pipeline emits. The web UI maps these
 * to display names ("Apple Silicon", "Windows 10/11", etc).
 */
export const desktopPlatformSchema = z.enum([
  'macos-arm64',
  'macos-intel',
  'windows-x64',
  'linux-x64',
]);
export type DesktopPlatform = z.infer<typeof desktopPlatformSchema>;

/**
 * Notify a customer when a build for a given platform becomes available.
 * Phase 1 stores these in a JSONL file on the API host.
 */
export const desktopNotifyRequestSchema = z.object({
  email: emailSchema,
  platform: desktopPlatformSchema,
});
export type DesktopNotifyRequest = z.infer<typeof desktopNotifyRequestSchema>;

export const desktopNotifyResponseSchema = z.object({
  ok: z.literal(true),
});
export type DesktopNotifyResponse = z.infer<typeof desktopNotifyResponseSchema>;
