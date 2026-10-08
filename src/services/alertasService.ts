import { apiRequest } from './apiClient';
import type { RangoHistorial } from './historialService';

// Pestaña Alertas del jefe de turno (en línea, como el historial). Se calculan desde los turnos:
// - TURNO_EXTENDIDO: el turno llegó a las 10 h
// - CIERRE_AUTOMATICO: el sistema lo cerró a las 12 h (probablemente el operador olvidó finalizarlo)

export type TipoAlerta = 'TURNO_EXTENDIDO' | 'CIERRE_AUTOMATICO';
export type FiltroAlertas = 'TODO' | 'EXTENDIDOS' | 'CIERRES_AUTOMATICOS';

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
}

export interface PaginaAlertas {
  alertas: Alerta[];
  hayMas: boolean;
  activas: number; // turnos abiertos hace más de 10 h en este momento
}

export const listarAlertas = (tipo: FiltroAlertas, rango: RangoHistorial, ultimo?: { fecha: string; id: string }) => {
  const params = new URLSearchParams({ tipo, desde: rango.desde });
  if (rango.hasta) params.set('hasta', rango.hasta);
  if (ultimo) {
    params.set('antes', ultimo.fecha);
    params.set('antesId', ultimo.id);
  }
  return apiRequest<PaginaAlertas>(`/alertas?${params.toString()}`);
};
