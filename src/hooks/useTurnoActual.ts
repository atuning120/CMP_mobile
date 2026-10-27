import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import {
  Area,
  ZonaTrabajo,
  UseTurnoActualResult,
  TurnoActual,
  EstadoOperacional,
  TurnoCerradoAutomaticamente,
  TurnoCerradoPorJefe,
  IniciarTurnoDatos,
  FinalizarTurnoDatos,
} from '../types/turno';
import * as operaciones from '../services/operacionesTurno';
import { suscribirCambioDatos } from '../sync/eventos';
import { sincronizacionEnCurso } from '../sync/syncEngine';
import { mostrarAviso } from '../services/retroalimentacion';
import { mensajeDeError } from '../utils/errores';
import { activarSeguimiento, finalizarSeguimiento, sincronizarSeguimiento } from '../services/seguimientoUbicacion';

// Tope de espera a la sincronización al abrir la pantalla: con mala señal no se bloquea al operador
const ESPERA_SINCRONIZACION_MS = 6000;

/**
 * Turno en curso del operador, leído de la base local: funciona igual con o sin conexión.
 * Las acciones se guardan en el teléfono y se sincronizan en segundo plano. Cerrar sesión no
 * termina el turno.
 */
export const useTurnoActual = (): UseTurnoActualResult => {
  const [turno, setTurno] = useState<TurnoActual | null>(null);
  const [turnoCerradoAutomaticamente, setTurnoCerradoAutomaticamente] = useState<TurnoCerradoAutomaticamente | null>(null);
  const [turnoCerradoPorJefe, setTurnoCerradoPorJefe] = useState<TurnoCerradoPorJefe | null>(null);
  const [estadosCatalogo, setEstadosCatalogo] = useState<EstadoOperacional[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Lee la base local y devuelve el turno en curso (null si no hay o si falló la lectura)
  const leer = useCallback(async (): Promise<TurnoActual | null> => {
    try {
      const [actual, estados] = await Promise.all([operaciones.obtenerTurnoActual(), operaciones.catalogoEstados()]);
      setTurno(actual.turno);
      setTurnoCerradoAutomaticamente(actual.turnoCerradoAutomaticamente);
      setTurnoCerradoPorJefe(actual.turnoCerradoPorJefe);
      setEstadosCatalogo(estados);
      setError(null);
      // El envío de ubicación sigue al turno (p. ej. se detiene si el jefe de turno lo cerró)
      void sincronizarSeguimiento(actual.turno !== null);
      return actual.turno;
    } catch (e) {
      setError(new Error(mensajeDeError(e, 'No se pudo cargar el turno.')));
      return null;
    }
  }, []);

  const cargar = useCallback(async () => {
    await leer();
    setIsLoading(false);
  }, [leer]);

  const iniciarTurno = useCallback(async (datos: IniciarTurnoDatos) => {
    await operaciones.iniciarTurno(datos);
    // Sin esperar: pide el permiso de ubicación si falta, sin demorar la confirmación del turno
    void activarSeguimiento();
  }, []);

  const finalizarTurno = useCallback(
    async (datos: FinalizarTurnoDatos) => {
      if (!turno) throw new operaciones.OperacionError('No hay un turno en curso.');
      const estado = await operaciones.finalizarTurno(turno.idCliente, datos);
      // Sin esperar: manda la última posición de la máquina y detiene el envío
      void finalizarSeguimiento(turno.maquina.id);
      return estado;
    },
    [turno],
  );

  const cambiarUbicacion = useCallback(
    async (area: Area, zona: ZonaTrabajo | null) => {
      if (!turno) throw new operaciones.OperacionError('No hay un turno en curso.');
      await operaciones.cambiarUbicacion(turno.idCliente, area, zona);
    },
    [turno],
  );

  // Mientras se guarda un cambio de estado se ignoran los demás toques: con dos toques rápidos sobre
  // la misma tarjeta (antes de que la pantalla muestre el nuevo estado) se registraba dos veces
  const cambiandoEstado = useRef(false);
  const updateEstadoActual = useCallback(
    (nuevoEstado: EstadoOperacional) => {
      if (!turno || cambiandoEstado.current) return;
      cambiandoEstado.current = true;
      operaciones
        .cambiarEstadoOperacional(turno.idCliente, nuevoEstado)
        .then(() => mostrarAviso(`Estado: ${nuevoEstado.nombre}`))
        .catch((e) => {
          const mensaje = mensajeDeError(e, 'Intenta nuevamente.');
          setError(new Error(mensaje));
          mostrarAviso('No se pudo cambiar el estado', { detalle: mensaje, tipo: 'error' });
        })
        .finally(() => {
          cambiandoEstado.current = false;
        });
    },
    [turno],
  );

  useEffect(() => {
    let activo = true;
    const timer = setTimeout(async () => {
      const turnoLocal = await leer();
      // Recién instalada la app (o tras iniciar sesión en otro teléfono) la base local no tiene el turno
      // que sigue abierto en el servidor. Mientras la sincronización lo trae se muestra "cargando" y no
      // "sin turno", para no ofrecer iniciar un segundo turno; con mala señal se espera como máximo
      // ESPERA_SINCRONIZACION_MS y se sigue con lo guardado (la sincronización avisará si llega después)
      const enCurso = turnoLocal ? null : sincronizacionEnCurso();
      if (enCurso) {
        await Promise.race([enCurso, new Promise((resolver) => setTimeout(resolver, ESPERA_SINCRONIZACION_MS))]);
        if (activo) await leer();
      }
      if (activo) setIsLoading(false);
    }, 0);
    // Se relee cuando cambian los datos locales (acción del operador o sincronización en segundo plano)
    const desuscribir = suscribirCambioDatos(() => void cargar());
    // Al volver a primer plano y cada minuto se re-evalúa el límite de 13 h
    const suscripcionApp = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void cargar();
    });
    const intervalo = setInterval(() => void cargar(), 60 * 1000);
    return () => {
      activo = false;
      clearTimeout(timer);
      desuscribir();
      suscripcionApp.remove();
      clearInterval(intervalo);
    };
  }, [cargar, leer]);

  return {
    turno,
    turnoCerradoAutomaticamente,
    turnoCerradoPorJefe,
    isLoading,
    error,
    refetch: () => void cargar(),
    iniciarTurno,
    finalizarTurno,
    estadosCatalogo,
    updateEstadoActual,
    cambiarUbicacion,
  };
};
