import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseApiResult<T> extends AsyncState<T> {
  refetch: () => void;
}

/**
 * Small fetch hook: loading/error state plus a manual refetch, with
 * stale-response protection (a slow earlier request can't clobber a later
 * one). `deps` re-runs the fetch, same contract as useEffect's array.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: React.DependencyList = []): UseApiResult<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ data: prev.data, loading: true, error: null }));

    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof ApiError ? err.message : 'Could not reach the API';
        setState({ data: null, loading: false, error: message });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const refetch = useCallback(() => setTick((value) => value + 1), []);

  return { ...state, refetch };
}
