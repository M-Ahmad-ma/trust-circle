/**
 * API logging.
 *
 * Everything that crosses the network boundary goes through here so a request
 * can be traced end to end: method, path, status, duration, and the server's
 * error code when one comes back.
 *
 * Two rules:
 *  - Credentials are never logged. Anything that looks like a token, password
 *    or Authorization header is redacted before it reaches a sink.
 *  - Errors always log; info only in development. `__DEV__` is false in release
 *    builds, so a shipping app stays quiet.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogEntry = {
  id: number;
  at: number;
  level: LogLevel;
  scope: string;
  message: string;
  data?: Record<string, unknown>;
  /** Milliseconds, for request/response pairs. */
  durationMs?: number;
};

const RING_LIMIT = 300;

const SENSITIVE_KEYS = /^(password|accessToken|refreshToken|token|authorization|secret)$/i;
const BEARER = /\bBearer\s+[A-Za-z0-9._-]+/g;

let entries: LogEntry[] = [];
let nextId = 1;
let listeners: ((entry: LogEntry) => void)[] = [];

/** Replaces anything that could be a credential with a marker. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[deep]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return value.replace(BEARER, 'Bearer [redacted]');
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => redact(item, depth + 1));
  if (value instanceof Error) return { name: value.name, message: value.message };
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEYS.test(key) ? '[redacted]' : redact(item, depth + 1);
    }
    return out;
  }
  return String(value);
}

/**
 * Defaults to __DEV__, so a release build stays quiet. Exposed so verbose
 * logging can be forced on (and so the logger is testable outside RN).
 */
let verbose = typeof __DEV__ !== 'undefined' && __DEV__;

export function setVerboseLogging(on: boolean): void {
  verbose = on;
}

export function isVerboseLogging(): boolean {
  return verbose;
}

function shouldLog(level: LogLevel): boolean {
  if (level === 'error' || level === 'warn') return true;
  return verbose;
}

function push(
  level: LogLevel,
  scope: string,
  message: string,
  data?: Record<string, unknown>,
  durationMs?: number
) {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    id: nextId++,
    at: Date.now(),
    level,
    scope,
    message,
    ...(data ? { data: redact(data) as Record<string, unknown> } : {}),
    ...(durationMs !== undefined ? { durationMs } : {}),
  };

  // Ring buffer: keeps memory flat on long sessions.
  entries = [...entries, entry].slice(-RING_LIMIT);

  for (const listener of listeners) listener(entry);

  const time = new Date(entry.at).toISOString().slice(11, 23);
  const tag = `[api:${scope}]`;
  const ms = durationMs !== undefined ? ` ${Math.round(durationMs)}ms` : '';

  if (level === 'error') console.error(`${time} ${tag} ${message}${ms}`, entry.data ?? '');
  else if (level === 'warn') console.warn(`${time} ${tag} ${message}${ms}`, entry.data ?? '');
  else console.log(`${time} ${tag} ${message}${ms}`, entry.data ?? '');
}

export type Logger = {
  debug: (message: string, data?: Record<string, unknown>) => void;
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
  time: (message: string) => (data?: Record<string, unknown>) => void;
  child: (scope: string) => Logger;
};

export function createLogger(scope: string): Logger {
  return {
    debug: (message, data) => push('debug', scope, message, data),
    info: (message, data) => push('info', scope, message, data),
    warn: (message, data) => push('warn', scope, message, data),
    error: (message, data) => push('error', scope, message, data),
    /** Wraps a call so its duration lands on a single entry. */
    time: (message: string) => {
      const start = Date.now();
      return (data?: Record<string, unknown>) => {
        push('info', scope, message, data, Date.now() - start);
      };
    },
    child: (child: string) => createLogger(`${scope}:${child}`),
  };
}

/** Scoped loggers, so call sites read as `log.request.info(...)`. */
export const log = {
  request: createLogger('request'),
  response: createLogger('response'),
  auth: createLogger('auth'),
  session: createLogger('session'),
  upload: createLogger('upload'),
  query: createLogger('query'),
};

export function getLogEntries(): LogEntry[] {
  return entries;
}

export function clearLogEntries(): void {
  entries = [];
}

export function subscribeToLogs(listener: (entry: LogEntry) => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((entry) => entry !== listener);
  };
}
