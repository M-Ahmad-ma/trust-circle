import { useCallback, useEffect, useRef, useState } from 'react';

import { isApiError } from '@/api/errors';
import { log } from '@/api/logger';

export type QueryState<T> =
  | { status: 'loading'; data: T | null }
  | { status: 'ready'; data: T }
  /** `data` is T when the query ran and came back empty, null when disabled. */
  | { status: 'empty'; data: T | null }
  | { status: 'error'; data: T | null; message: string };

type Options<T> = {
  /**
   * Identity of the query. Changing it re-runs the fetch, and a mismatched key
   * *is* the loading state — so switching queries never flashes stale content
   * and never needs a synchronous setState inside the effect.
   */
  key: string;
  /** Return true to signal "nothing here". Defaults to empty-array detection. */
  isEmpty?: (data: T) => boolean;
  enabled?: boolean;
  errorMessage?: string;
};

/**
 * Minimal data hook for API reads. It exists so screens stop falling back to
 * mock content: `loading`, `empty` and `error` are all first-class states, and
 * the caller is expected to render something honest for each.
 */
export function useApiQuery<T>(
  fetcher: () => Promise<T>,
  { key, isEmpty, enabled = true, errorMessage }: Options<T>
) {
  const [reloadToken, setReloadToken] = useState(0);
  // key identifies the query; the token forces a re-run of the same query.
  const identity = `${key}#${reloadToken}`;

  const [settled, setSettled] = useState<{ identity: string; value: QueryState<T> }>({
    identity,
    value: { status: 'loading', data: null },
  });

  // Callers pass inline closures, so the fetcher identity changes every render
  // and must not be a dependency. It is synced before the fetch effect runs.
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  // `isEmpty` is a callback too (callers pass `() => false`), so it gets the same
  // treatment. Leaving it in the effect deps below would re-arm the fetch on every
  // render, since each new closure would invalidate the array — a request loop that
  // only stops when the screen unmounts.
  const isEmptyRef = useRef(isEmpty);

  useEffect(() => {
    isEmptyRef.current = isEmpty;
  }, [isEmpty]);

  // Guards a slow response from overwriting a newer one.
  const latestRequest = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const ticket = ++latestRequest.current;
    let cancelled = false;

    (async () => {
      try {
        const data = await fetcherRef.current();
        if (cancelled || ticket !== latestRequest.current) return;

        const emptyCheck = isEmptyRef.current;
        const empty = emptyCheck ? emptyCheck(data) : Array.isArray(data) && data.length === 0;
        log.query.info(`${key} → ${empty ? 'empty' : 'ready'}`, { key });
        setSettled({ identity, value: { status: empty ? 'empty' : 'ready', data } });
      } catch (error) {
        if (cancelled || ticket !== latestRequest.current) return;

        const message = isApiError(error)
          ? (errorMessage ?? error.message)
          : (errorMessage ?? 'Could not reach Trust Circle.');

        log.query.error(`${key} failed`, {
          key,
          code: isApiError(error) ? error.code : 'NETWORK',
        });

        // Keep whatever was already on screen rather than blanking it.
        setSettled((current) => ({
          identity,
          value: {
            status: 'error',
            data: current.identity === identity ? current.value.data : null,
            message,
          },
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
    // `fetcher` and `isEmpty` are intentionally excluded — they are read through
    // refs above, and `key` is the real identity. `errorMessage` stays because a
    // changed message should genuinely re-run the query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity, enabled, errorMessage]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  // Derived: a key change means "loading" without a render-time setState.
  const state: QueryState<T> = !enabled
    ? { status: 'empty', data: null }
    : settled.identity === identity
      ? settled.value
      : { status: 'loading', data: null };

  return { ...state, refetch };
}
