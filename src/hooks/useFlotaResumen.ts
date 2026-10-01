import { useState, useEffect, useMemo } from 'react';

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
}

const MOCK_FLOTA: MaquinaFlota[] = [
  {
    id: 1,
    codigo: 'CAEX-204',
    patente: 'JJ-PR-44',
    marcaModelo: 'Caterpillar 793F High Altitude',
    estadoOperativo: 'FUERA_DE_SERVICIO',
    fallaActiva: 'Sobretemperatura en convertidor de torque y fuga hidráulica activa',
    operadorAsignado: 'Sin operador asignado',
    zonaActual: 'Taller Central',
    horometroActual: 14280.5,
    combustible: { porcentaje: 42, tipo: 'Petróleo' }
  },
  {
    id: 2,
    codigo: 'CAEX-205',
    patente: 'KT-RS-12',
    marcaModelo: 'Komatsu 930E-4',
    estadoOperativo: 'OPERATIVO',
    fallaActiva: null,
    operadorAsignado: 'María López',
    zonaActual: 'Fase 4 - Banco 320',
    horometroActual: 8940.2,
    combustible: { porcentaje: 78, tipo: 'Petróleo' }
  },
  {
    id: 3,
    codigo: 'PALA-02',
    patente: 'XX-YY-99',
    marcaModelo: 'P&H 4100XPC',
    estadoOperativo: 'OPERATIVO',
    fallaActiva: null,
    operadorAsignado: 'Carlos Díaz',
    zonaActual: 'Fase 4 - Frente de Carguío',
    horometroActual: 21050.0,
    combustible: null
  }
];

export const useFlotaResumen = (): UseFlotaResumenResult => {
  const [maquinas, setMaquinas] = useState<MaquinaFlota[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = async () => {
    try {
      // TODO: reemplazar por datos reales cuando se definan patente, estado_operativo, fallas mecánicas y combustible en el backend
      await new Promise(resolve => setTimeout(resolve, 600)); // Simulate latency
      setMaquinas(MOCK_FLOTA);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar la flota'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const refetch = () => {
    setIsLoading(true);
    setError(null);
    loadData();
  };

  const contadorFlota = useMemo(() => maquinas.length, [maquinas]);

  return { maquinas, contadorFlota, isLoading, error, refetch };
};
