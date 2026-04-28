/**
 * Browser-side environment lookup.
 *
 * Vite exposes only variables prefixed with `VITE_`. We collapse them into
 * a small typed object so the rest of the app reads from one place.
 */

interface AppEnv {
  apiUrl: string;
  signalingUrl: string;
  clientPublicUrl: string;
}

function readVar(key: string, fallback: string): string {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return value && value.length > 0 ? value : fallback;
}

export const env: AppEnv = {
  apiUrl: readVar('VITE_API_URL', 'http://localhost:3000'),
  signalingUrl: readVar('VITE_SIGNALING_URL', 'ws://localhost:3001'),
  clientPublicUrl: readVar('VITE_CLIENT_PUBLIC_URL', 'http://localhost:5174'),
};
