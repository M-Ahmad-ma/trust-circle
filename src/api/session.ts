import * as SecureStore from 'expo-secure-store';

import { ApiRequestError } from './errors';
import { log } from './logger';
import type { ApiErrorBody, AuthSession } from './types';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const ACCESS_KEY = 'trust-circle.accessToken';
const REFRESH_KEY = 'trust-circle.refreshToken';

/**
 * Tokens live in memory for the request path and in SecureStore for reloads.
 * SecureStore is used over AsyncStorage because these are bearer credentials.
 */
let accessToken: string | null = null;
let refreshToken: string | null = null;
let hydrated = false;

/**
 * Subscribers are notified whenever the in-memory session changes, so React
 * gates can re-render on sign-in and sign-out. Module state alone cannot drive
 * a re-render — a component reading `accessToken` would never learn it moved.
 */
type SessionListener = () => void;
const listeners = new Set<SessionListener>();

export function subscribeSession(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifySession() {
  for (const listener of listeners) listener();
}

export function apiBaseUrl(): string {
  return BASE_URL;
}

/** Server returns relative image paths (`/uploads/...`); this resolves them. */
export function absoluteUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Read by `authApi.logout` so the server can revoke this exact token. Exposed
 * rather than wrapped so the caller can revoke server-side and then clear
 * locally through the one path that keeps both stores in step.
 */
export function getRefreshToken(): string | null {
  return refreshToken;
}

export function hasSession(): boolean {
  return accessToken !== null;
}

export async function hydrateSession(): Promise<boolean> {
  if (hydrated) return hasSession();

  log.session.info('hydrating session from secure store');
  try {
    const [access, refresh] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
    ]);
    accessToken = access;
    refreshToken = refresh;
  } catch {
    // A locked or unavailable keychain must not brick the app — fall back to
    // an anonymous session rather than crashing on launch.
    accessToken = null;
    refreshToken = null;
  }

  hydrated = true;
  notifySession();
  log.session.info(hasSession() ? 'session restored' : 'no stored session');
  return hasSession();
}

async function persist(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;

  try {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, access),
      SecureStore.setItemAsync(REFRESH_KEY, refresh),
    ]);
  } catch {
    // Keep the in-memory session alive even if persistence failed.
  }
  notifySession();
}

export async function setSession(session: AuthSession): Promise<void> {
  await persist(session.accessToken, session.refreshToken);
  log.session.info('session established', { userId: session.user.id, email: session.user.email });
}

export async function clearSession(): Promise<void> {
  log.session.info('clearing session');
  accessToken = null;
  refreshToken = null;

  try {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  } catch {
    // Nothing actionable; the in-memory session is already gone.
  }
  notifySession();
}

/**
 * Refresh tokens are single-use: every refresh revokes the old one. Concurrent
 * callers must therefore share ONE in-flight refresh, or the second request
 * replays a dead token and the API answers INVALID_REFRESH_TOKEN, logging the
 * user out mid-session.
 */
let inFlightRefresh: Promise<boolean> | null = null;

export function refreshSession(): Promise<boolean> {
  if (inFlightRefresh) return inFlightRefresh;

  const token = refreshToken;
  if (!token) return Promise.resolve(false);

  inFlightRefresh = (async () => {
    log.auth.info('refreshing access token');

    try {
      const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: token }),
      });

      if (!response.ok) {
        log.auth.error(`refresh rejected (${response.status}) — clearing session`);
        await clearSession();
        return false;
      }

      const body = (await response.json()) as {
        data: { accessToken: string; refreshToken: string };
      };
      // Rotation: both tokens must be replaced together.
      await persist(body.data.accessToken, body.data.refreshToken);
      log.auth.info('access token refreshed and rotated');
      return true;
    } catch (error) {
      // A network blip is not proof the session died — keep the tokens and let
      // the caller surface a retry rather than forcing a logout.
      log.auth.warn('refresh could not reach the server; keeping session', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    } finally {
      inFlightRefresh = null;
    }
  })();

  return inFlightRefresh;
}

/**
 * Raw JSON POST used only by the auth endpoints, which need no bearer token.
 *
 * Unlike `api()`, this used to be completely silent — a failed sign-in left no
 * trace in the Network log at all, so an unreachable server was
 * indistinguishable from a wrong password. It now logs the URL it dialled and
 * the code it got back, and reports a `fetch` failure as `NETWORK_ERROR` so the
 * UI can say "cannot reach the server" instead of blaming the user's password.
 *
 * The body is deliberately never logged. `api()` can log its payloads because
 * `redact()` strips credential-shaped keys, but auth bodies are the one place
 * where a plain mistake would put a password in a log ring buffer.
 */
export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const url = `${BASE_URL}${path}`;
  log.request.info(`${path} →`, { url });

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // `fetch` has no default timeout; a server that accepts the connection
      // but never answers would otherwise leave the sign-in spinning forever.
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    // `fetch` only throws when nothing came back at all — DNS, refused
    // connection, unreachable host, TLS, or a timeout. The server never judged
    // anything, so this must not surface as a credential problem.
    const reason = error instanceof Error ? error.message : String(error);
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    log.request.error(`${path} — ${timedOut ? 'timed out' : 'could not reach'} ${BASE_URL}`, {
      error: reason,
    });
    throw new ApiRequestError(0, {
      error: {
        code: 'NETWORK_ERROR',
        message: timedOut
          ? `The server at ${BASE_URL} did not respond in time`
          : `Could not reach the server at ${BASE_URL}`,
        details: { url, reason, timedOut },
      },
    });
  }

  const payload = (await response.json().catch(() => null)) as ApiErrorBody | null;
  const code = payload?.error?.code;

  log.response.info(`${path} → ${response.status}${code ? ` ${code}` : ''}`, {
    status: response.status,
    ...(code ? { code } : {}),
  });

  if (!response.ok) {
    throw new ApiRequestError(
      response.status,
      payload ?? {
        error: { code: 'INTERNAL_ERROR', message: `Request failed (${response.status})` },
      }
    );
  }

  return (payload as unknown as { data: T }).data;
}
