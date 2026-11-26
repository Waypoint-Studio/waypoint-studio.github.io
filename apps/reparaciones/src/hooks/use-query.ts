import { useCallback, useEffect, useRef, useState } from 'react';

interface QueryState<T> {
  readonly data: T | null;
  readonly error: string | null;
  readonly loading: boolean;
  readonly reload: () => void;
}

interface Settled<T> {
  readonly key: string | null;
  readonly data: T | null;
  readonly error: string | null;
}

export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Ocurrió un error inesperado.';

export const useQuery = <T>(key: string, load: () => Promise<T>): QueryState<T> => {
  const loadRef = useRef(load);
  const [version, setVersion] = useState(0);
  const [settled, setSettled] = useState<Settled<T>>({ key: null, data: null, error: null });
  const requestKey = `${key}#${version}`;

  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    let active = true;
    loadRef
      .current()
      .then((data) => {
        if (active) {
          setSettled({ key: requestKey, data, error: null });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setSettled((previous) => ({ key: requestKey, data: previous.data, error: errorMessage(error) }));
        }
      });
    return () => {
      active = false;
    };
  }, [requestKey]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);
  const loading = settled.key !== requestKey;

  return { data: settled.data, error: loading ? null : settled.error, loading, reload };
};
