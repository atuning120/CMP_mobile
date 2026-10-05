import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Carga una lista desde la API. Con `fetcher` en null la lista queda vacía (p. ej. zonas sin área elegida).
 * `fetcher` debe ser estable (useCallback/useMemo): cada cambio dispara una nueva carga.
 */
export const useRemoteList = <T>(fetcher: (() => Promise<T[]>) | null) => {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  // Descarta respuestas de cargas anteriores (p. ej. si el operador cambia de área rápidamente)
  const ultimaCarga = useRef(0);

  const load = useCallback(async () => {
    const carga = ++ultimaCarga.current;
    setItems([]);
    setError(null);
    if (!fetcher) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await fetcher();
      if (carga === ultimaCarga.current) setItems(data);
    } catch (e) {
      if (carga === ultimaCarga.current) setError(e instanceof Error ? e : new Error('Error al cargar los datos'));
    } finally {
      if (carga === ultimaCarga.current) setIsLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  return { items, isLoading, error, refetch: load };
};
