import { ApiRequestError } from './errors';
import { log } from './logger';
import { apiBaseUrl, clearSession, getAccessToken, refreshSession } from './session';
import type { ApiErrorBody } from './types';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** Plain object bodies are JSON-encoded automatically. */
  json?: unknown;
  /** Pass FormData as-is — never set Content-Type, the runtime adds the boundary. */
  form?: FormData;
  signal?: AbortSignal;
}

/**
 * Fetch wrapper: attaches the bearer token and retries once after a refresh.
 *
 * A 401 is only retried for `INVALID_TOKEN`. `UNAUTHORIZED` (missing/malformed
 * header) and `INVALID_REFRESH_TOKEN` mean the session is gone — retrying those
 * would burn the single-use refresh token, so they clear the session instead.
 */
export async function api(
  path: string,
  options: RequestOptions = {},
  retried = false
): Promise<Response> {
  const { method = 'GET', json, form: formBody, signal } = options;

  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  // Only a JSON string body gets a Content-Type. FormData must leave it unset so
  // the runtime can write the multipart boundary.
  if (json !== undefined) headers['Content-Type'] = 'application/json';

  const startedAt = Date.now();
  const form = json !== undefined ? JSON.stringify(json) : formBody;

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      method,
      headers,
      body: form,
      signal,
    });
  } catch (error) {
    // Network-level failure: no response at all.
    log.response.error(`${method} ${path} — network failure`, {
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  const durationMs = Date.now() - startedAt;

  log.response.info(`${method} ${path} → ${response.status}`, {
    durationMs,
    ...(json !== undefined ? { body: json } : form !== undefined ? { body: '[FormData]' } : {}),
  });

  if (response.status >= 400) {
    const code = await peekErrorCode(response);
    log.response.error(`${method} ${path} → ${response.status} ${code ?? 'UNKNOWN'}`, {
      durationMs,
      method,
      path,
    });
  }

  if (response.status === 401 && !retried) {
    const code = await peekErrorCode(response);
    log.auth.warn(`${method} ${path} → 401 ${code ?? 'UNKNOWN'}`);

    if (code === 'INVALID_TOKEN' && (await refreshSession())) {
      log.auth.info('refreshed — retrying original request once');
      return api(path, options, true);
    }

    if (code === 'UNAUTHORIZED' || code === 'INVALID_REFRESH_TOKEN') {
      log.auth.error('session unrecoverable — clearing tokens');
      await clearSession();
    }
  }

  return response;
}

/** Reads the error code without consuming the body the caller still needs. */
async function peekErrorCode(response: Response): Promise<string | null> {
  try {
    const body = (await response.clone().json()) as ApiErrorBody | null;
    return body?.error?.code ?? null;
  } catch {
    return null;
  }
}

export interface Unwrapped<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Unwraps `{ data, meta }` or throws a typed ApiRequestError carrying the
 * server's code — callers branch on the code, never on the message.
 */
export async function unwrap<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiRequestError(
      response.status,
      (payload as ApiErrorBody | null) ?? {
        error: { code: 'INTERNAL_ERROR', message: `Request failed (${response.status})` },
      }
    );
  }

  return (payload as Unwrapped<T>).data;
}

/** For endpoints where the caller needs `meta` as well as `data`. */
export async function unwrapWithMeta<T>(
  response: Response
): Promise<{ data: T; meta: Record<string, unknown> | undefined }> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiRequestError(
      response.status,
      (payload as ApiErrorBody | null) ?? {
        error: { code: 'INTERNAL_ERROR', message: `Request failed (${response.status})` },
      }
    );
  }

  const body = payload as Unwrapped<T>;
  return { data: body.data, meta: body.meta };
}
