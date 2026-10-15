import { ThemeColors } from './theme';
import {
  MOTIVOS_DESHABILITAR,
  MOTIVOS_HABILITAR,
  MOTIVOS_MANTENIMIENTO,
  MOTIVOS_OBSERVACION,
  MOTIVOS_RESERVA,
} from './motivosJefeTurno';

// Estados de una máquina (MAQUINA.estado en el Backend). BAJA = fuera de servicio: no puede iniciar turno
// y es la única que se puede reemplazar. "Sin operador" no es un estado: se deduce de la asignación
export type EstadoMaquina = 'ACTIVA' | 'BAJO_OBSERVACION' | 'EN_MANTENIMIENTO' | 'EN_RESERVA' | 'BAJA';

export interface PresentacionEstado {
  valor: EstadoMaquina;
  etiqueta: string;
  color: (t: ThemeColors) => string;
  // Texto sobre fondo claro del color (el ámbar puro no se lee)
  colorTexto: (t: ThemeColors) => string;
  motivos: string[];
}

export const ESTADOS_MAQUINA: PresentacionEstado[] = [
  { valor: 'ACTIVA', etiqueta: 'Operativo', color: (t) => t.success, colorTexto: (t) => t.success, motivos: MOTIVOS_HABILITAR },
  {
    valor: 'BAJO_OBSERVACION',
    etiqueta: 'Operativo bajo observación',
    color: (t) => t.warning,
    colorTexto: (t) => t.warningText,
    motivos: MOTIVOS_OBSERVACION,
  },
  {
    valor: 'EN_MANTENIMIENTO',
    etiqueta: 'En mantenimiento',
    color: (t) => t.primary,
    colorTexto: (t) => t.primaryText,
    motivos: MOTIVOS_MANTENIMIENTO,
  },
  { valor: 'EN_RESERVA', etiqueta: 'En reserva', color: (t) => t.textTertiary, colorTexto: (t) => t.textSecondary, motivos: MOTIVOS_RESERVA },
  { valor: 'BAJA', etiqueta: 'Fuera de servicio', color: (t) => t.danger, colorTexto: (t) => t.dangerText, motivos: MOTIVOS_DESHABILITAR },
];

// Un valor desconocido (Backend más nuevo o dato antiguo) se trata como operativo, como hacía la app
export const presentacionEstado = (estado: string | null): PresentacionEstado =>
  ESTADOS_MAQUINA.find((e) => e.valor === estado) ?? ESTADOS_MAQUINA[0];
