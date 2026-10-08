import { useCallback, useEffect, useState } from 'react';

// Si la carga nunca llega a empezar (p. ej. una recarga descartada), el indicador no queda girando
const ESPERA_MAXIMA_MS = 10000;

type Fase = 'inactiva' | 'esperando' | 'cargando' | 'promesa';

/**
 * Estado del gesto "deslizar hacia abajo para recargar" (RefreshControl).
 * - Si `recargar` devuelve una promesa, el indicador se muestra hasta que termine.
 * - Si no (un refetch que solo dispara la carga), se muestra hasta que `cargando` pase a true y vuelva a false.
 */
export const useRecargaManual = (recargar: () => void | Promise<unknown>, cargando = false) => {
  const [fase, setFase] = useState<Fase>('inactiva');

  if (fase === 'esperando' && cargando) setFase('cargando');
  if (fase === 'cargando' && !cargando) setFase('inactiva');

  useEffect(() => {
    if (fase !== 'esperando') return;
    const timer = setTimeout(() => setFase('inactiva'), ESPERA_MAXIMA_MS);
    return () => clearTimeout(timer);
  }, [fase]);

  const onRefresh = useCallback(() => {
    const resultado = recargar();
    if (resultado instanceof Promise) {
      setFase('promesa');
      resultado.catch(() => undefined).finally(() => setFase('inactiva'));
    } else {
      setFase('esperando');
    }
  }, [recargar]);

  return { refreshing: fase !== 'inactiva', onRefresh };
};
