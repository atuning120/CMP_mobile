import { apiRequest } from './apiClient';
import type { RangoHistorial } from './historialService';

// Pestaña Alertas del jefe de turno (en línea, como el historial; la atención también se puede hacer sin señal). Se calculan desde los turnos:
// - TURNO_EXTENDIDO: el turno llegó a las 10 h
// - CIERRE_AUTOMATICO: el sistema lo cerró al superar la duración máxima (13 h; antes 12 h) (probablemente el operador olvidó finalizarlo)
// - JORNADA_EXTENDIDA: el operador sumó 10 h en una jornada de varios turnos (p. ej. cambió de máquina por una falla):
//   la fatiga se mide por jornada, así que cambiar de máquina no reinicia la cuenta
// - MANTENCION: el operador marcó un estado de mantención o falla (en rojo en el mapa web); activa mientras siga en él

export type TipoAlerta = 'TURNO_EXTENDIDO' | 'CIERRE_AUTOMATICO' | 'JORNADA_EXTENDIDA' | 'MANTENCION';
export type FiltroAlertas = 'TODO' | 'EXTENDIDOS' | 'CIERRES_AUTOMATICOS' | 'MANTENCIONES';
// Si alguien ya atendió la alerta
export type EstadoAtencion = 'TODAS' | 'PENDIENTES' | 'ATENDIDAS';

// Quién atendió la alerta, cuándo y con qué comentario. La primera es la atención; las siguientes, notas posteriores.
// Nada se edita ni se borra
export interface AtencionAlerta {
  usuario: string;
  fecha: string; // ISO 8601
  comentario: string | null;
  // Hecha en este teléfono sin señal y aún no enviada (solo en la app): su operación en la cola y por qué la rechazó el servidor
  pendiente?: { idOperacion: number; error: string | null };
}

// Máximo que acepta el Backend
export const LARGO_MAXIMO_COMENTARIO = 500;

export interface Alerta {
  id: string;
  tipo: TipoAlerta;
  fecha: string; // ISO 8601
  operador: string;
  maquina: { id: number; nombre: string };
  turno: {
    id: number;
    estado: 'EN_CURSO' | 'CERRADO' | 'CERRADO_AUTO';
    horaInicio: string;
    horaTermino: string | null;
    horometroInicial: number | null;
    horometroFinal: number | null;
  };
  area: string | null;
  zona: string | null;
  // Solo JORNADA_EXTENDIDA (ausente en un Backend anterior): desde cuándo trabaja, en cuántos turnos y cuántas horas lleva
  jornada?: { inicio: string; turnos: number; horas: number } | null;
  // Solo MANTENCION: el estado que marcó el operador, desde cuándo y hasta cuándo (fin null = sigue detenida)
  detencion?: { estado: string; inicio: string; fin: string | null } | null;
  // Vacío = pendiente (ausente en un Backend anterior)
  atenciones?: AtencionAlerta[];
}

export interface PaginaAlertas {
  alertas: Alerta[];
  hayMas: boolean;
  // Lo que requiere acción ahora: operadores con más de 10 h trabajadas (en su turno o sumando su jornada) y máquinas
  // detenidas en mantención o falla
  activas: number;
}

export const listarAlertas = (
  tipo: FiltroAlertas,
  estado: EstadoAtencion,
  rango: RangoHistorial,
  ultimo?: { fecha: string; id: string },
) => {
  const params = new URLSearchParams({ tipo, estado, desde: rango.desde });
  if (rango.hasta) params.set('hasta', rango.hasta);
  if (ultimo) {
    params.set('antes', ultimo.fecha);
    params.set('antesId', ultimo.id);
  }
  return apiRequest<PaginaAlertas>(`/alertas?${params.toString()}`);
};

/**
 * Atiende la alerta (la primera vez; comentario opcional) o le agrega una nota (después; comentario obligatorio).
 * Devuelve todas sus atenciones. Sin señal se usa `atenderAlertaJefe` (accionesJefe.ts), que la deja en la cola.
 * idCliente (UUID): el mismo en cada reintento, para no duplicarla. atencionesVistas: cuántas tenía al atenderla; si
 * otro jefe de turno la atendió entremedio, la de este se agrega igual (las dos quedan registradas).
 * fechaAccion: cuándo se atendió, si se hizo sin señal y se envía después.
 */
export const atenderAlerta = (idAlerta: string, comentario: string, idCliente: string, atencionesVistas: number, fechaAccion?: string) =>
  apiRequest<{ idAlerta: string; atenciones: AtencionAlerta[] }>(`/alertas/${encodeURIComponent(idAlerta)}/atenciones`, {
    method: 'POST',
    body: JSON.stringify({ comentario, idCliente, atencionesVistas, fechaAccion }),
  });
