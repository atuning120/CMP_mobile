import { presentacionEstado } from '../constants/estadosMaquina';
import type { OperacionPendiente } from './colaSync';

/*
 * Vigencia de las acciones del jefe de turno hechas sin señal (decisión de negocio), según cuándo las hizo:
 * - Menos de 24 h: se envían normalmente (la versión de la máquina protege lo que otro cambió mientras tanto).
 * - Entre 24 y 72 h: quedan en "Requiere confirmación" hasta que el jefe de turno elija enviarlas o descartarlas, y
 *   detienen solo las siguientes de esa misma máquina.
 * - Más de 72 h: se descartan solas, se avisa y quedan en el registro local. El Backend también las rechaza (respaldo).
 * Las atenciones de alertas no vencen: una nota sigue siendo válida aunque llegue tarde.
 */
export const HORAS_CONFIRMACION = 24;
export const HORAS_VENCIMIENTO = 72;

export type Tramo = 'VIGENTE' | 'POR_CONFIRMAR' | 'VENCIDA';

const HORA_MS = 60 * 60 * 1000;

// Solo las del jefe de turno (tienen usuario y fecha de la acción); las del operador siguen otras reglas
export const tramoDe = (operacion: OperacionPendiente, ahora: number = Date.now()): Tramo => {
  if (!operacion.usuario || !operacion.fechaAccion || operacion.tipo === 'ATENDER_ALERTA') return 'VIGENTE';
  const horas = (ahora - new Date(operacion.fechaAccion).getTime()) / HORA_MS;
  if (horas > HORAS_VENCIMIENTO) return 'VENCIDA';
  // Ya confirmada por el jefe de turno: se envía aunque tenga más de 24 h
  if (horas > HORAS_CONFIRMACION && operacion.payload.confirmada !== true) return 'POR_CONFIRMAR';
  return 'VIGENTE';
};

const NOMBRE_CAMPO: Record<string, string> = {
  nombre: 'código',
  marca: 'marca',
  modelo: 'modelo',
  tipoMaquina: 'tipo',
  anio: 'año',
  patente: 'patente',
  numeroChasis: 'chasis',
  esContratista: 'contratista',
  idOperador: 'operador',
};

// Qué es la acción, en palabras del jefe de turno: "Cambio de estado de CF-05 a En mantenimiento"
export const describirOperacion = (operacion: OperacionPendiente): string => {
  const p = operacion.payload as Record<string, any>;
  const maquina = p.codigo ?? (p.idMaquina ? `la máquina #${p.idMaquina}` : 'una máquina');
  switch (operacion.tipo) {
    case 'ATENDER_ALERTA':
      return p.resumen ? `Atención de la alerta de ${p.resumen}` : 'Atención de una alerta';
    case 'CERRAR_TURNO':
      return `Cierre del turno${p.operador ? ` de ${p.operador}` : ''} en ${maquina}`;
    case 'EDITAR_MAQUINA': {
      if (p.datos?.estado) return `Cambio de estado de ${maquina} a ${presentacionEstado(p.datos.estado).etiqueta}`;
      const campos = Object.keys(p.datos ?? {}).filter((c) => NOMBRE_CAMPO[c]).map((c) => NOMBRE_CAMPO[c]);
      return `Edición de ${maquina}${campos.length ? ` (${campos.join(', ')})` : ''}`;
    }
    case 'CREAR_MAQUINA':
      return `Incorporación de ${String(p.datos?.nombre ?? '').trim().toUpperCase() || 'una máquina'}`;
    default:
      return 'Registro del turno';
  }
};
