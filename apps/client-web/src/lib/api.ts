import {
  type ApiError,
  type JoinSessionRequest,
  type JoinSessionResponse,
  type SessionInfoResponse,
} from '@lume/protocol';

import { env } from './env';

const API_BASE = `${env.apiUrl.replace(/\/$/, '')}/v1`;

export class ApiClientError extends Error {
  readonly statusCode: number;
  readonly errorCode: string;

  constructor(envelope: ApiError) {
    super(envelope.message);
    this.name = 'ApiClientError';
    this.statusCode = envelope.statusCode;
    this.errorCode = envelope.error;
  }
}

async function apiRequest<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set('content-type', 'application/json');

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    body: json === undefined ? rest.body : JSON.stringify(json),
  });
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload: unknown = isJson ? await response.json() : null;
  if (!response.ok) {
    if (isJson && payload && typeof payload === 'object' && 'statusCode' in payload) {
      throw new ApiClientError(payload as ApiError);
    }
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
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
