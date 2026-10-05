import { useCallback, useEffect, useState } from 'react';
import { EvidenciaLocal } from '../db/turnoLocal';
import { listarEvidenciasLocales } from '../services/operacionesTurno';
import { suscribirCambioDatos } from '../sync/eventos';

export interface EvidenciaHistorial {
  id: string;                    // idCliente de la evidencia
  urlFoto: string;               // copia local de la foto
  descripcionReporte: string;    // REPORTE_TURNO.descripcion
  area: string;
  fechaHora: string;             // ISO 8601
  estadoSincronizacion: EvidenciaLocal['estadoSync'];
  origen: EvidenciaLocal;
}

export interface UseEvidenciasHistorialResult {
  evidencias: EvidenciaHistorial[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const TIPO_LABEL: Record<string, string> = { INICIO: 'Inicio de turno', FIN: 'Cierre de turno', NOVEDAD: 'Novedad' };

/**
 * Evidencias registradas en este teléfono, con su estado de sincronización.
 */
export const useEvidenciasHistorial = (): UseEvidenciasHistorialResult => {
  const [evidencias, setEvidencias] = useState<EvidenciaHistorial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const cargar = useCallback(async () => {
    try {
      const locales = await listarEvidenciasLocales();
      setEvidencias(
        locales.map((evidencia) => ({
          id: evidencia.idCliente,
          urlFoto: evidencia.uriLocal,
          descripcionReporte: evidencia.descripcion ?? TIPO_LABEL[evidencia.tipoReporte] ?? 'Sin descripción',
          area: evidencia.area ?? 'Sin área',
          fechaHora: evidencia.fechaHora,
          estadoSincronizacion: evidencia.estadoSync,
          origen: evidencia,
        })),
      );
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Error al cargar las evidencias'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void cargar(), 0);
    const desuscribir = suscribirCambioDatos(() => void cargar());
    return () => {
      clearTimeout(timer);
      desuscribir();
    };
  }, [cargar]);

  return { evidencias, isLoading, error, refetch: () => void cargar() };
};
