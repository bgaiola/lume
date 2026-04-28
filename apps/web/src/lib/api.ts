import { type ApiError } from '@lume/protocol';

import { env } from './env';

const API_BASE = `${env.apiUrl.replace(/\/$/, '')}/v1`;

/**
 * Thin error class that preserves the canonical ApiError envelope returned
 * by the backend so the UI can branch on `error.error` (e.g. ValidationError).
 */
export class ApiClientError extends Error {
  readonly statusCode: number;
  readonly errorCode: string;
  readonly details: unknown;

  constructor(envelope: ApiError) {
    super(envelope.message);
    this.name = 'ApiClientError';
    this.statusCode = envelope.statusCode;
    this.errorCode = envelope.error;
    this.details = envelope.details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
}

export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, token, signal }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
    credentials: 'include',
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
