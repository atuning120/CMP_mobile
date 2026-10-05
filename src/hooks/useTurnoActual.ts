import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { UseTurnoActualResult, TurnoActual, EstadoOperacional, TurnoCerradoAutomaticamente, IniciarTurnoDatos } from '../types/turno';
import * as turnoService from '../services/turnoService';
import { ApiError } from '../services/apiClient';

// TODO: reemplazar por GET /estados-operacionales cuando el endpoint esté listo
const MOCK_CATALOGO: EstadoOperacional[] = [
  { id: 1, nombre: 'Producción', categoria: 'PRODUCTIVO' },
  { id: 2, nombre: 'Colación', categoria: 'DEMORA' },
  { id: 3, nombre: 'Traslado', categoria: 'DEMORA' },
  { id: 4, nombre: 'Espera', categoria: 'DEMORA' },
  { id: 5, nombre: 'Falla', categoria: 'MANTENCION' },
];

/**
 * Turno en curso del operador autenticado. El turno vive en el Backend, así que cerrar sesión
 * no lo termina: al volver a ingresar se recupera con GET /turnos/actual.
 */
export const useTurnoActual = (): UseTurnoActualResult => {
  const [turno, setTurno] = useState<TurnoActual | null>(null);
  const [turnoCerradoAutomaticamente, setTurnoCerradoAutomaticamente] = useState<TurnoCerradoAutomaticamente | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const aplicarRespuesta = useCallback((data: turnoService.TurnoActualResponse) => {
    setTurno(data.turno);
    setTurnoCerradoAutomaticamente(data.turnoCerradoAutomaticamente);
  }, []);

  const fetchTurno = useCallback(async (silencioso = false) => {
    if (!silencioso) setIsLoading(true);
    setError(null);
    try {
      aplicarRespuesta(await turnoService.obtenerTurnoActual());
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Error al cargar el turno'));
    } finally {
      setIsLoading(false);
    }
  }, [aplicarRespuesta]);

  const iniciarTurno = useCallback(async (datos: IniciarTurnoDatos) => {
    aplicarRespuesta(await turnoService.iniciarTurno(datos));
  }, [aplicarRespuesta]);

  const finalizarTurno = useCallback(async (horometroFinal: number) => {
    if (!turno) return;
    try {
      await turnoService.finalizarTurno(turno.id, horometroFinal);
      setTurno(null);
    } catch (e) {
      // Si el Backend lo cerró por superar 12 h (o ya estaba cerrado), sincronizamos el estado real
      if (e instanceof ApiError && e.status === 409) {
        await fetchTurno(true);
      }
      throw e;
    }
  }, [turno, fetchTurno]);

  const updateEstadoActual = useCallback((nuevoEstado: EstadoOperacional) => {
    setTurno(prev => {
      if (!prev) return prev;

      const nuevoTurnoEstadoActual = {
        id: Math.floor(Math.random() * 1000) + 300,
        estado: nuevoEstado,
        inicio: new Date().toISOString()
      };

      // Mover el actual al historial
      const historialModificado = [...prev.historialEstados];
      if (historialModificado.length > 0) {
        const ultimo = historialModificado[historialModificado.length - 1];
        if (ultimo.fin === null) {
          ultimo.fin = new Date().toISOString();
        }
      }
      historialModificado.push({
        estado: nuevoEstado,
        inicio: nuevoTurnoEstadoActual.inicio,
        fin: null
      });

      return {
        ...prev,
        estadoOperacionalActual: nuevoTurnoEstadoActual,
        historialEstados: historialModificado
      };
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchTurno(), 0);
    return () => clearTimeout(timer);
  }, [fetchTurno]);

  // Al volver la app a primer plano se revalida: el turno pudo cerrarse automáticamente mientras tanto
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchTurno(true);
    });
    return () => subscription.remove();
  }, [fetchTurno]);

  return {
    turno,
    turnoCerradoAutomaticamente,
    isLoading,
    error,
    refetch: fetchTurno,
    iniciarTurno,
    finalizarTurno,
    estadosCatalogo: MOCK_CATALOGO,
    updateEstadoActual
  };
};
