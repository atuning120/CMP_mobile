import { useCallback, useEffect, useState } from 'react';
import { listarTiposMaquina } from '../services/flotaService';

// Opciones del selector "Tipo de máquina": se piden al abrir el modal y quedan en memoria
export const useTiposMaquina = (habilitado: boolean) => {
  const [tipos, setTipos] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargado, setCargado] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!habilitado || cargado) return;
    let cancelado = false;
    const timer = setTimeout(async () => {
      setCargando(true);
      setError(null);
      try {
        const respuesta = await listarTiposMaquina();
        if (cancelado) return;
        setTipos(respuesta);
        setCargado(true);
      } catch (err) {
        if (!cancelado) setError(err instanceof Error ? err.message : 'No se pudieron cargar los tipos de máquina.');
      } finally {
        if (!cancelado) setCargando(false);
      }
    }, 0);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [habilitado, cargado, intento]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);

  return { tipos, cargando, error, reintentar };
};
