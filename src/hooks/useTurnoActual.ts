import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import {
  UseTurnoActualResult,
  TurnoActual,
  EstadoOperacional,
  TurnoCerradoAutomaticamente,
  IniciarTurnoDatos,
  FinalizarTurnoDatos,
} from '../types/turno';
import * as operaciones from '../services/operacionesTurno';
import { suscribirCambioDatos } from '../sync/eventos';

/**
 * Turno en curso del operador, leído de la base local: funciona igual con o sin conexión.
 * Las acciones se guardan en el teléfono y se sincronizan en segundo plano. Cerrar sesión no
 * termina el turno.
 */
export const useTurnoActual = (): UseTurnoActualResult => {
  const [turno, setTurno] = useState<TurnoActual | null>(null);
  const [turnoCerradoAutomaticamente, setTurnoCerradoAutomaticamente] = useState<TurnoCerradoAutomaticamente | null>(null);
  const [estadosCatalogo, setEstadosCatalogo] = useState<EstadoOperacional[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [actual, estados] = await Promise.all([operaciones.obtenerTurnoActual(), operaciones.catalogoEstados()]);
      setTurno(actual.turno);
      setTurnoCerradoAutomaticamente(actual.turnoCerradoAutomaticamente);
      setEstadosCatalogo(estados);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Error al cargar el turno'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const iniciarTurno = useCallback(async (datos: IniciarTurnoDatos) => {
    await operaciones.iniciarTurno(datos);
  }, []);

  const finalizarTurno = useCallback(
    async (datos: FinalizarTurnoDatos) => {
      if (!turno) throw new operaciones.OperacionError('No hay un turno en curso.');
      return operaciones.finalizarTurno(turno.idCliente, datos);
    },
    [turno],
  );

  const updateEstadoActual = useCallback(
    (nuevoEstado: EstadoOperacional) => {
      if (!turno) return;
      operaciones.cambiarEstadoOperacional(turno.idCliente, nuevoEstado).catch((e) => setError(e instanceof Error ? e : new Error(String(e))));
    },
    [turno],
  );

  useEffect(() => {
    const timer = setTimeout(() => void cargar(), 0);
    // Se relee cuando cambian los datos locales (acción del operador o sincronización en segundo plano)
    const desuscribir = suscribirCambioDatos(() => void cargar());
    // Al volver a primer plano y cada minuto se re-evalúa el límite de 12 h
    const suscripcionApp = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void cargar();
    });
    const intervalo = setInterval(() => void cargar(), 60 * 1000);
    return () => {
      clearTimeout(timer);
      desuscribir();
      suscripcionApp.remove();
      clearInterval(intervalo);
    };
  }, [cargar]);

  return {
    turno,
    turnoCerradoAutomaticamente,
    isLoading,
    error,
    refetch: () => void cargar(),
    iniciarTurno,
    finalizarTurno,
    estadosCatalogo,
    updateEstadoActual,
  };
};
