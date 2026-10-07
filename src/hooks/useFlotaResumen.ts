import { useState, useEffect, useMemo, useCallback } from 'react';
import { listarFlota, MaquinaFlotaApi } from '../services/flotaService';

export type EstadoOperativo = 'OPERATIVO' | 'FUERA_DE_SERVICIO';

export interface MaquinaFlota {
  id: number;
  codigo: string;
  patente: string;
  marcaModelo: string;
  estadoOperativo: EstadoOperativo;
  fallaActiva: string | null;
  operadorAsignado: string | null;
  zonaActual: string | null;
  horometroActual: number;
  combustible: { porcentaje: number; tipo: string } | null;
}

export interface UseFlotaResumenResult {
  maquinas: MaquinaFlota[];
  contadorFlota: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  actualizarMaquina: (maquina: MaquinaFlota) => void;
}

// Espera tras la última tecla antes de consultar al Backend
const DEBOUNCE_BUSQUEDA_MS = 300;

// TODO: fallas mecánicas y combustible aún no existen en la base de datos
const mapMaquinaFlota = (maquina: MaquinaFlotaApi): MaquinaFlota => ({
  id: maquina.idMaquina,
  codigo: maquina.nombre,
  patente: maquina.patente ?? '',
  marcaModelo: [[maquina.marca, maquina.modelo].filter(Boolean).join(' '), maquina.tipoMaquina].filter(Boolean).join(' · '),
  estadoOperativo: maquina.estado === 'BAJA' ? 'FUERA_DE_SERVICIO' : 'OPERATIVO',
  fallaActiva: null,
  operadorAsignado: maquina.operadorActual,
  zonaActual: maquina.ubicacionActual,
  horometroActual: maquina.horometroActual ?? 0,
  combustible: null,
});

export const useFlotaResumen = (busqueda: string): UseFlotaResumenResult => {
  const [maquinas, setMaquinas] = useState<MaquinaFlota[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [recargas, setRecargas] = useState(0);

  useEffect(() => {
    // Solo marca la consulta como obsoleta: fetchBackend maneja su propio timeout
    const controlador = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const respuesta = await listarFlota(busqueda);
        if (controlador.signal.aborted) return;
        setMaquinas(respuesta.map(mapMaquinaFlota));
      } catch (err) {
        // Una búsqueda más nueva reemplazó a esta: se descarta su resultado
        if (controlador.signal.aborted) return;
        setError(err instanceof Error ? err : new Error('Error al cargar la flota'));
      } finally {
        if (!controlador.signal.aborted) setIsLoading(false);
      }
    }, DEBOUNCE_BUSQUEDA_MS);
    return () => {
      clearTimeout(timer);
      controlador.abort();
    };
  }, [busqueda, recargas]);

  const refetch = useCallback(() => setRecargas((n) => n + 1), []);

  // TODO: persistir en el Backend cuando exista el endpoint de edición / cambio de estado
  const actualizarMaquina = useCallback((maquinaActualizada: MaquinaFlota) => {
    setMaquinas((prev) => prev.map((m) => (m.id === maquinaActualizada.id ? maquinaActualizada : m)));
  }, []);

  const contadorFlota = useMemo(() => maquinas.length, [maquinas]);

  return { maquinas, contadorFlota, isLoading, error, refetch, actualizarMaquina };
};
