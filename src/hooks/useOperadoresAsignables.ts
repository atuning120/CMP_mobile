import { useCallback, useEffect, useState } from 'react';
import { listarOperadoresAsignables, OperadorAsignableApi } from '../services/flotaService';
import { mensajeDeError } from '../utils/errores';
import { consultarConCopia } from '../db/consultaLocal';

export interface OperadoresAsignables {
  operadores: OperadorAsignableApi[];
  cargando: boolean;
  error: string | null;
  reintentar: () => void;
}

// Opciones del selector "Operador asignado". Se recargan cada vez que se abre el modal:
// muestran a qué máquina está asignado hoy cada operador. Sin señal, la última lista recibida
export const useOperadoresAsignables = (habilitado: boolean): OperadoresAsignables => {
  const [operadores, setOperadores] = useState<OperadorAsignableApi[]>([]);
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
        const lista = await consultarConCopia('catalogo|operadores', listarOperadoresAsignables);
        if (!cancelado) setOperadores(lista);
      } catch (err) {
        if (!cancelado) setError(mensajeDeError(err, 'No se pudieron cargar los operadores.'));
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

  return { operadores, cargando, error, reintentar };
};
