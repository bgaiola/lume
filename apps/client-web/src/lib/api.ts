import {
  type ApiError,
  type JoinSessionRequest,
  type JoinSessionResponse,
  type SessionInfoResponse,
} from '@lume/protocol';

import { env } from './env';

const API_BASE = `${env.apiUrl.replace(/\/$/, '')}/v1`;

/**
 * What the customer is shown for each way a session can be unavailable.
 *
 * The API answers in English, for engineers. Raw strings like "Session is no
 * longer accepting clients" were reaching the customer's screen, and the
 * customer is a non-technical Spanish speaker who did nothing wrong. Each case
 * also says what to do next, because "ha caducado" without "pide otro enlace"
 * just turns into a phone call.
 */
const STATUS_COPY: Record<number, string> = {
  404: 'Este enlace no existe. Comprueba con tu técnico que el código es correcto.',
  409: 'Esta sesión ya ha terminado. Pídele a tu técnico que te envíe un enlace nuevo.',
  410: 'Este enlace ha caducado. Pídele a tu técnico que te envíe uno nuevo.',
  429: 'Demasiados intentos seguidos. Espera un minuto y vuelve a probar.',
  500: 'Ha habido un problema por nuestra parte. Vuelve a intentarlo en un momento.',
  502: 'No hemos podido conectar con el servidor. Vuelve a intentarlo en un momento.',
  503: 'El servicio no está disponible ahora mismo. Vuelve a intentarlo en unos minutos.',
};

const FALLBACK_COPY = 'No se ha podido conectar. Comprueba tu conexión y vuelve a intentarlo.';

export class ApiClientError extends Error {
  readonly statusCode: number;
  readonly errorCode: string;

  constructor(envelope: ApiError) {
    super(STATUS_COPY[envelope.statusCode] ?? FALLBACK_COPY);
    this.name = 'ApiClientError';
    this.statusCode = envelope.statusCode;
    this.errorCode = envelope.error;
  }
}

/** True when retrying could plausibly work, which drives the retry button. */
export function isRetryable(err: unknown): boolean {
  if (err instanceof ApiClientError) {
    return err.statusCode >= 500 || err.statusCode === 429;
  }
  return true;
}

async function apiRequest<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set('content-type', 'application/json');

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers,
      body: json === undefined ? rest.body : JSON.stringify(json),
    });
  } catch {
    // The server is unreachable: offline, DNS, or the API is down. Without
    // this the customer saw the browser's raw "Failed to fetch".
    throw new Error('No hemos podido contactar con el servidor. Comprueba tu conexión a internet.');
  }
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload: unknown = isJson ? await response.json() : null;
  if (!response.ok) {
    if (isJson && payload && typeof payload === 'object' && 'statusCode' in payload) {
      throw new ApiClientError(payload as ApiError);
    }
    throw new Error(STATUS_COPY[response.status] ?? FALLBACK_COPY);
  }
  return payload as T;
}

export function fetchSessionInfo(code: string): Promise<SessionInfoResponse> {
  return apiRequest<SessionInfoResponse>(`/sessions/${encodeURIComponent(code)}/info`);
}

export function joinSession(code: string, body: JoinSessionRequest): Promise<JoinSessionResponse> {
  return apiRequest<JoinSessionResponse>(`/sessions/${encodeURIComponent(code)}/join`, {
    method: 'POST',
    json: body,
  });
}
