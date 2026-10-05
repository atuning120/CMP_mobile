/*
 * Avisos entre el motor de sincronización y la UI. La UI lee la base local; cuando el motor
 * cambia datos en segundo plano (p. ej. el servidor cerró el turno), emite "datos" para que las
 * pantallas vuelvan a leer, y "estado" cuando cambia el progreso de la sincronización.
 */

export interface EstadoSincronizacion {
  sincronizando: boolean;
  pendientes: number;
  errores: number;
  ultimaSincronizacion: string | null; // ISO 8601
  ultimoError: string | null;
}

type Oyente<T> = (valor: T) => void;

const oyentesDatos = new Set<Oyente<void>>();
const oyentesEstado = new Set<Oyente<EstadoSincronizacion>>();

let estadoActual: EstadoSincronizacion = {
  sincronizando: false,
  pendientes: 0,
  errores: 0,
  ultimaSincronizacion: null,
  ultimoError: null,
};

export const emitirCambioDatos = () => oyentesDatos.forEach((oyente) => oyente());

export const suscribirCambioDatos = (oyente: () => void) => {
  oyentesDatos.add(oyente);
  return () => {
    oyentesDatos.delete(oyente);
  };
};

export const obtenerEstadoSincronizacion = () => estadoActual;

export const actualizarEstadoSincronizacion = (cambios: Partial<EstadoSincronizacion>) => {
  estadoActual = { ...estadoActual, ...cambios };
  oyentesEstado.forEach((oyente) => oyente(estadoActual));
};

export const suscribirEstadoSincronizacion = (oyente: Oyente<EstadoSincronizacion>) => {
  oyentesEstado.add(oyente);
  return () => {
    oyentesEstado.delete(oyente);
  };
};
