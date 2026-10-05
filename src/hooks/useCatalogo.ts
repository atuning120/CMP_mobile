import { useCallback, useEffect, useRef, useState } from 'react';
import { leerCatalogo, TipoCatalogo } from '../db/catalogoLocal';
import { suscribirCambioDatos } from '../sync/eventos';
import { sincronizarCatalogos } from '../sync/syncEngine';

/**
 * Catálogo leído de la base local (funciona offline). Si está vacío intenta descargarlo; además se
 * actualiza solo cuando el motor de sincronización trae una versión nueva.
 */
export const useCatalogo = <T>(tipo: TipoCatalogo, enabled: boolean, idPadre?: number | null) => {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const ultimaCarga = useRef(0);

  const leer = useCallback(async () => {
    const carga = ++ultimaCarga.current;
    if (!enabled || idPadre === null) {
      setItems([]);
      return [];
    }
    const datos = await leerCatalogo<T>(tipo, idPadre);
    if (carga === ultimaCarga.current) setItems(datos);
    return datos;
  }, [tipo, enabled, idPadre]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await sincronizarCatalogos(true);
      await leer();
    } catch {
      const datos = await leer();
      if (datos.length === 0) setError(new Error('Sin datos guardados. Conéctate una vez para descargarlos.'));
    } finally {
      setIsLoading(false);
    }
  }, [leer]);

  useEffect(() => {
    let activo = true;
    const timer = setTimeout(async () => {
      const datos = await leer();
      // Primer uso en este teléfono: no hay catálogo guardado, se intenta descargar
      if (activo && enabled && idPadre !== null && datos.length === 0) await refetch();
    }, 0);
    const desuscribir = suscribirCambioDatos(() => void leer());
    return () => {
      activo = false;
      clearTimeout(timer);
      desuscribir();
    };
  }, [leer, refetch, enabled, idPadre]);

  return { items, isLoading, error, refetch };
};
