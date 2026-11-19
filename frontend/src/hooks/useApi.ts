import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api/client';

interface Settled<T> {
  source: () => Promise<T>;
  data?: T;
  error?: ApiError;
}

export function useApi<T>(fetcher: () => Promise<T>) {
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((data) => {
        if (!cancelled) setSettled({ source: fetcher, data });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const error =
          err instanceof ApiError
            ? err
            : new ApiError(0, 'Непередбачена помилка', 'Спробуйте ще раз.');
        setSettled({ source: fetcher, error });
      });
    return () => {
      cancelled = true;
    };
  }, [fetcher, attempt]);

  const loading = settled === null || settled.source !== fetcher;
  const data = settled?.data;
  const error = loading ? null : (settled?.error ?? null);

  const reload = useCallback(() => {
    setSettled(null);
    setAttempt((n) => n + 1);
  }, []);

  return { data, error, loading, reload };
}