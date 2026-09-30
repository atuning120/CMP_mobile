import { useState, useEffect, useCallback } from 'react';
import { UseTurnoActualResult, TurnoActual, EstadoOperacional } from '../types/turno';

const MOCK_CATALOGO: EstadoOperacional[] = [
  { id: 1, nombre: 'Producción', categoria: 'PRODUCTIVO' },
  { id: 2, nombre: 'Colación', categoria: 'DEMORA' },
  { id: 3, nombre: 'Traslado', categoria: 'DEMORA' },
  { id: 4, nombre: 'Espera', categoria: 'DEMORA' },
  { id: 5, nombre: 'Falla', categoria: 'MANTENCION' },
];

const MOCK_TURNO: TurnoActual = {
  id: 101,
  maquina: {
    id: 1,
    codigoCorto: 'CF-01',
    nombreCompleto: 'Cargador Frontal CAT 988K High Lift',
    tipoMaquina: 'Cargador Frontal'
  },
  area: {
    id: 1,
    nombre: 'Chancador Primario'
  },
  horometroInicial: 12540.5,
  estado: 'EN_CURSO',
  estadoOperacionalActual: {
    id: 201,
    estado: MOCK_CATALOGO[1], // Colación
    inicio: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // Hace 45 minutos
  },
  historialEstados: [
    {
      estado: MOCK_CATALOGO[0], // Producción
      inicio: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // Hace 3 horas
      fin: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // Fin hace 45 min
    },
    {
      estado: MOCK_CATALOGO[1], // Colación
      inicio: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // Hace 45 minutos
      fin: null, // Actual
    }
  ],
  cantidadEvidencias: 2,
  fechaInicio: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // Hace 3 horas
};

export const useTurnoActual = (): UseTurnoActualResult => {
  const [turno, setTurno] = useState<TurnoActual | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTurno = useCallback(() => {
    setIsLoading(true);
    setError(null);
    
    // TODO: reemplazar por llamada real a GET /turnos/actual cuando el endpoint esté listo
    setTimeout(() => {
      try {
        setTurno(MOCK_TURNO);
        setIsLoading(false);
      } catch {
        setError(new Error('Error al cargar el turno'));
        setIsLoading(false);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchTurno(), 0);
    return () => clearTimeout(timer);
  }, [fetchTurno]);

  return {
    turno,
    isLoading,
    error,
    refetch: fetchTurno,
    estadosCatalogo: MOCK_CATALOGO
  };
};
