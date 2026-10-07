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

export const listarHistorial = (tipo: FiltroHistorial, antes?: string) => {
  const params = new URLSearchParams({ tipo });
  if (antes) params.set('antes', antes);
  return apiRequest<PaginaHistorial>(`/historial?${params.toString()}`);
};
