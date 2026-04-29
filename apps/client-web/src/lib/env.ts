interface AppEnv {
  apiUrl: string;
  signalingUrl: string;
}

function readVar(key: string, fallback: string): string {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return value && value.length > 0 ? value : fallback;
}

export const env: AppEnv = {
  apiUrl: readVar('VITE_CLIENT_API_URL', 'http://localhost:3000'),
  signalingUrl: readVar('VITE_CLIENT_SIGNALING_URL', 'http://localhost:3001'),
};
