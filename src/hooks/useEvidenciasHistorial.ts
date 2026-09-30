import { useState, useEffect } from 'react';

export interface EvidenciaHistorial {
  id: number;
  urlFoto: string;
  descripcionReporte: string;   // viene de REPORTE_TURNO.descripcion
  area: string;                  // resuelta por el backend desde TURNO_UBICACION vigente al momento del reporte
  fechaHora: string;             // ISO 8601
  estadoSincronizacion: 'PENDIENTE' | 'SINCRONIZADO' | 'ERROR_SINCRONIZACION';
}

export interface UseEvidenciasHistorialResult {
  evidencias: EvidenciaHistorial[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Mock data
const MOCK_EVIDENCIAS: EvidenciaHistorial[] = [
  {
    id: 1,
    urlFoto: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop', // Mock mining/machinery photo
    descripcionReporte: 'Inspección de neumático delantero derecho. Se observa desgaste irregular y leve corte superficial.',
    area: 'Fase 4 Norte',
    fechaHora: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    estadoSincronizacion: 'SINCRONIZADO',
  },
  {
    id: 2,
    urlFoto: 'https://images.unsplash.com/photo-1579621970220-410a8c279c94?q=80&w=600&auto=format&fit=crop',
    descripcionReporte: 'Falla en sistema hidráulico. Fuga de aceite detectada en cilindro de levante.',
    area: 'Botadero Sur',
    fechaHora: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    estadoSincronizacion: 'PENDIENTE',
  },
  {
    id: 3,
    urlFoto: 'https://images.unsplash.com/photo-1508215967006-039c947e923e?q=80&w=600&auto=format&fit=crop',
    descripcionReporte: 'Condición de terreno inestable post tronadura. Bloques sobretamaño en frente de carguío.',
    area: 'Fase 5 Centro',
    fechaHora: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    estadoSincronizacion: 'ERROR_SINCRONIZACION',
  },
  {
    id: 4,
    urlFoto: 'https://images.unsplash.com/photo-1541625602330-2277a4c4618c?q=80&w=600&auto=format&fit=crop',
    descripcionReporte: 'Limpieza de frente completada. Zona lista para ingreso de perforadora.',
    area: 'Fase 4 Norte',
    fechaHora: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    estadoSincronizacion: 'SINCRONIZADO',
  }
];

export const useEvidenciasHistorial = (operadorId: number): UseEvidenciasHistorialResult => {
  const [evidencias, setEvidencias] = useState<EvidenciaHistorial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvidencias = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: reemplazar por GET /evidencias?operadorId=... cuando el backend exponga el join con REPORTE_TURNO y TURNO_UBICACION
      // await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network latency
      
      // Simulating API call
      setTimeout(() => {
        setEvidencias(MOCK_EVIDENCIAS);
        setIsLoading(false);
      }, 800);
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar evidencias'));
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidencias();
  }, [operadorId]);

  const refetch = () => {
    fetchEvidencias();
  };

  return { evidencias, isLoading, error, refetch };
};
