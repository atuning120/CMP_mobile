import * as Haptics from 'expo-haptics';

/*
 * Retroalimentación de las acciones del usuario: vibración y aviso breve en pantalla. En la cabina, con
 * guantes, ruido y la máquina vibrando, el operador debe saber sin mirar fijo que su toque se registró.
 * Se usa la vibración de notificación (no performAndroidHapticsAsync): esta respeta el ajuste "vibrar al
 * tocar" del sistema, que suele venir apagado, y es demasiado sutil para notarse sobre un equipo en marcha.
 */

export type TipoAviso = 'exito' | 'info' | 'error';

export interface Aviso {
  id: number;
  mensaje: string;
  detalle?: string;
  tipo: TipoAviso;
}

const oyentes = new Set<(aviso: Aviso) => void>();
let siguienteId = 1;

// Nunca debe romper la acción: en un teléfono sin vibrador (o con el modo ahorro) simplemente no vibra
export const vibrar = (tipo: TipoAviso) => {
  const vibracion =
    tipo === 'exito'
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : tipo === 'error'
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  vibracion.catch(() => undefined);
};

/**
 * Muestra un aviso breve arriba de la pantalla (y vibra según el tipo).
 */
export const mostrarAviso = (mensaje: string, opciones: { detalle?: string; tipo?: TipoAviso } = {}) => {
  const aviso: Aviso = { id: siguienteId++, mensaje, detalle: opciones.detalle, tipo: opciones.tipo ?? 'exito' };
  vibrar(aviso.tipo);
  oyentes.forEach((oyente) => oyente(aviso));
};

export const suscribirAvisos = (oyente: (aviso: Aviso) => void) => {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
};
