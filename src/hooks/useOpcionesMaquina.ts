import { useCallback, useEffect, useState } from 'react';
import { listarMarcasMaquina, listarTiposMaquina } from '../services/flotaService';

export interface OpcionesMaquina {
  marcas: string[];
  tipos: string[];
  cargando: boolean;
  error: string | null;
  reintentar: () => void;
}

// Opciones de los selectores "Marca" y "Tipo de máquina". Se recargan cada vez que se abre el modal:
// al incorporar una máquina con una marca o tipo nuevo, aparecen la próxima vez.
export const useOpcionesMaquina = (habilitado: boolean): OpcionesMaquina => {
  const [marcas, setMarcas] = useState<string[]>([]);
  const [tipos, setTipos] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!habilitado) return;
    let cancelado = false;
    const timer = setTimeout(async () => {
      setCargando(true);
      setError(null);
      try {
        const [marcasApi, tiposApi] = await Promise.all([listarMarcasMaquina(), listarTiposMaquina()]);
        if (cancelado) return;
        setMarcas(marcasApi);
        setTipos(tiposApi);
      } catch (err) {
        if (!cancelado) setError(err instanceof Error ? err.message : 'No se pudieron cargar las opciones.');
      } finally {
        if (!cancelado) setCargando(false);
      }
    }, 0);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [habilitado, intento]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);

  return { marcas, tipos, cargando, error, reintentar };
};
