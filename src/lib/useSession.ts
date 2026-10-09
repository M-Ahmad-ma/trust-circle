import { useSyncExternalStore } from 'react';

import { getAccessToken, subscribeSession } from '@/api/session';

export interface SessionState {
  /**
   * True only when a live access token is in memory.
   *
   * Every API route requires a bearer token, so this is what decides whether
   * the tabs are reachable at all. Note this is `false` until SecureStore has
   * been read — the root layout renders nothing until that settles, so screens
   * never observe the gap.
   */
  isAuthenticated: boolean;
}

/**
 * Reads the module-level session as React state.
 *
 * The token lives outside React, so a plain read would never re-render a gate
 * on sign-in or sign-out. `useSyncExternalStore` subscribes to the store that
 * `session.ts` notifies, keeping the value and the render in step.
 */
export function useSession(): SessionState {
  const token = useSyncExternalStore(subscribeSession, getAccessToken, getAccessToken);

  return { isAuthenticated: token !== null };
}
