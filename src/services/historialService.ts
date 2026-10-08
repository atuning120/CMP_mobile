import { apiRequest } from './apiClient';

// Pestaña Historial del jefe de turno (en línea, como la flota)

export type TipoEventoHistorial = 'INICIO_TURNO' | 'INCORPORAR' | 'EDITAR' | 'HABILITAR' | 'DESHABILITAR' | 'REEMPLAZAR';
export type FiltroHistorial = 'TODO' | 'TURNOS' | 'FLOTA';

export interface EventoHistorial {
  id: string;
  tipo: TipoEventoHistorial;
  fecha: string; // ISO 8601
  actor: string;
  maquina: { id: number; nombre: string };
  motivo: string | null;
  observacion: string | null;
  detalle: Record<string, unknown> | null;
}

export interface PaginaHistorial {
  eventos: EventoHistorial[];
  hayMas: boolean;
}

// Rango de fechas en ISO; hasta es exclusiva y null significa "hasta ahora"
export interface RangoHistorial {
  desde: string;
  hasta: string | null;
}

// Cursor: el último evento recibido (fecha + id, para no perder eventos con la misma fecha)
export const listarHistorial = (tipo: FiltroHistorial, rango: RangoHistorial, ultimo?: Pick<EventoHistorial, 'fecha' | 'id'>) => {
  const params = new URLSearchParams({ tipo, desde: rango.desde });
  if (rango.hasta) params.set('hasta', rango.hasta);
  if (ultimo) {
    params.set('antes', ultimo.fecha);
    params.set('antesId', ultimo.id);
  }
  return apiRequest<PaginaHistorial>(`/historial?${params.toString()}`);
};
