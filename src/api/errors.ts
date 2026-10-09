import type { ApiErrorBody } from './types';

/** Every code in API.md §5. Union keeps `switch` exhaustive as the server grows. */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UPLOAD_ERROR'
  | 'NO_FILE'
  | 'INVALID_GEO'
  | 'INVALID_NAME'
  | 'VISITED_AT_FUTURE'
  | 'INVALID_VISITED_AT'
  | 'INVALID_PHOTOS'
  | 'PHOTOS_ATTACHED'
  | 'SELF_REQUEST'
  | 'SELF_BLOCK'
  | 'UNAUTHORIZED'
  | 'INVALID_TOKEN'
  | 'INVALID_REFRESH_TOKEN'
  | 'INVALID_CREDENTIALS'
  | 'NOT_VISIBLE'
  | 'NOT_OWNER'
  | 'BLOCKED'
  | 'YOU_BLOCKED_THEM'
  | 'NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'PLACE_NOT_FOUND'
  | 'EXPERIENCE_NOT_FOUND'
  | 'REQUEST_NOT_FOUND'
  | 'NOT_FRIENDS'
  | 'BLOCK_NOT_FOUND'
  | 'PHOTO_NOT_FOUND'
  | 'EMAIL_TAKEN'
  | 'ALREADY_FRIENDS'
  | 'REQUEST_ALREADY_SENT'
  | 'REQUEST_ALREADY_RECEIVED'
  | 'UNSUPPORTED_TYPE'
  | 'INTERNAL_ERROR';

/** Thrown by every helper in `endpoints/`. Carries the status for branching. */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error.message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = body.error.code;
    this.details = body.error.details;
  }
}

export function isApiError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}

/** Narrow to one code without needing a cast at every call site. */
export function hasCode(error: unknown, code: ApiErrorCode): boolean {
  return isApiError(error) && error.code === code;
}

type ValidationDetail = { path: string; message: string };

/**
 * `details` for VALIDATION_ERROR is field-level with dot-joined paths
 * (e.g. `email`). Returns a path→message map so a form can attach errors to the
 * exact input the server complained about.
 */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!isApiError(error) || error.code !== 'VALIDATION_ERROR') return {};

  const details = error.details;
  if (!Array.isArray(details)) return {};

  const map: Record<string, string> = {};
  for (const detail of details as ValidationDetail[]) {
    if (detail && typeof detail.path === 'string' && typeof detail.message === 'string') {
      map[detail.path] = detail.message;
    }
  }
  return map;
}

/** `details.requestId` — used to turn REQUEST_ALREADY_RECEIVED into Accept/Decline. */
export function requestIdFrom(error: unknown): string | null {
  if (!isApiError(error) || error.code !== 'REQUEST_ALREADY_RECEIVED') return null;
  const details = error.details as { requestId?: string } | undefined;
  return details?.requestId ?? null;
}

/**
 * API.md §4 — an experience that exists but is hidden returns 403 NOT_VISIBLE,
 * while a deleted one returns 404. They need different copy, so callers must be
 * able to tell them apart.
 */
export function isHiddenFromViewer(error: unknown): boolean {
  return hasCode(error, 'NOT_VISIBLE');
}

export function isMissing(error: unknown): boolean {
  return hasCode(error, 'EXPERIENCE_NOT_FOUND') || hasCode(error, 'PLACE_NOT_FOUND');
}
