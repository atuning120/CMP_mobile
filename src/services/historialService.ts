import { apiRequest } from './apiClient';
import { getBackendBaseUrl } from './backendUrl';

// Pestaña Historial del jefe de turno (en línea, como la flota; la primera página se guarda para verla sin señal)

export type TipoEventoHistorial =
  | 'INICIO_TURNO'
  | 'FIN_TURNO'
  | 'CAMBIO_UBICACION'
  | 'NOVEDAD'
  | 'INCORPORAR'
  | 'EDITAR'
  | 'HABILITAR'
  | 'DESHABILITAR'
  | 'CAMBIAR_ESTADO'
  | 'REEMPLAZAR'
  | 'DEVOLVER';
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

// Foto que subió un operador. Viene en detalle.reporte.evidencias (inicio y cierre de turno, junto con las
// instrucciones o novedades que escribió) o en detalle.evidencias (novedad durante el turno, con su texto en observacion)
export interface EvidenciaHistorial {
  id: string; // id_cliente (UUID) de la evidencia
  fecha: string; // ISO 8601
}

// El archivo exige el token: se carga con expo-image enviando el header Authorization
export const urlEvidencia = (idEvidencia: string) => `${getBackendBaseUrl()}/evidencias/${encodeURIComponent(idEvidencia)}/archivo`;

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
