import { apiRequest } from './apiClient';
import { TIMEOUT_SUBIDA_MS } from './backendUrl';
import { adjuntarFoto } from './fotos';
import { Area, CategoriaEstado, EstadoOperacional, EstadoTurno, Maquina, ZonaTrabajo } from '../types/turno';

/*
 * Llamadas al Backend. La UI no las usa directamente: trabaja contra la base local y el motor de
 * sincronización (src/sync) es quien llama a estas funciones en segundo plano.
 */

interface AreaApi {
  idArea: number;
  nombre: string;
  descripcion: string | null;
}

interface ZonaTrabajoApi {
  idZona: number;
  idArea: number;
  nombre: string;
  descripcion: string | null;
}

interface MaquinaApi {
  idMaquina: number;
  nombre: string;
  marca: string | null;
  modelo: string | null;
  tipoMaquina: string | null;
  estado: string | null;
  idOperadorAsignado?: number | null; // solo en el catálogo (GET /maquinas)
}

interface EstadoOperacionalApi {
  idEstado: number;
  nombre: string;
  categoria: CategoriaEstado | null;
  esProductivo?: boolean;
  descripcion?: string | null;
}

export interface TurnoApi {
  id: number;
  idCliente: string | null;
  idOperador: number;
  idMaquina: number;
  estado: EstadoTurno;
  fechaInicio: string;
  fechaFin: string | null;
  horometroInicial: number;
  horometroFinal: number | null;
  conflicto: boolean;
  conflictoDetalle: string | null;
}

export interface TurnoActualApi {
  turno:
    | (TurnoApi & {
        maquina: MaquinaApi | null;
        area: AreaApi | null;
        zona: ZonaTrabajoApi | null;
        historialEstados: { idCliente: string | null; inicio: string; fin: string | null; estado: EstadoOperacionalApi | null }[];
      })
    | null;
  turnoCerradoAutomaticamente: TurnoApi | null;
}

export const mapMaquina = (maquina: MaquinaApi): Maquina => ({
  id: maquina.idMaquina,
  codigoCorto: maquina.nombre,
  nombreCompleto: [maquina.tipoMaquina, maquina.modelo].filter(Boolean).join(' ') || maquina.nombre,
  tipoMaquina: maquina.tipoMaquina ?? '',
  modelo: maquina.modelo ?? '',
  idOperadorAsignado: maquina.idOperadorAsignado ?? null,
});

export const mapArea = (area: AreaApi): Area => ({ id: area.idArea, nombre: area.nombre, descripcion: area.descripcion });

export const mapZona = (zona: ZonaTrabajoApi): ZonaTrabajo => ({
  id: zona.idZona,
  idArea: zona.idArea,
  nombre: zona.nombre,
  descripcion: zona.descripcion,
});

export const mapEstado = (estado: EstadoOperacionalApi): EstadoOperacional => ({
  id: estado.idEstado,
  nombre: estado.nombre,
  categoria: estado.categoria ?? 'DEMORA',
  esProductivo: estado.esProductivo ?? estado.categoria === 'PRODUCTIVO',
  descripcion: estado.descripcion ?? null,
});

const post = <T>(path: string, body: Record<string, unknown>) =>
  apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) });

// Catálogos
export const listarMaquinasActivas = async (): Promise<Maquina[]> => (await apiRequest<MaquinaApi[]>('/maquinas')).map(mapMaquina);
export const listarAreasActivas = async (): Promise<Area[]> => (await apiRequest<AreaApi[]>('/areas')).map(mapArea);
export const listarZonasActivas = async (): Promise<ZonaTrabajo[]> => (await apiRequest<ZonaTrabajoApi[]>('/zonas')).map(mapZona);
export const listarEstadosOperacionales = async (): Promise<EstadoOperacional[]> =>
  (await apiRequest<EstadoOperacionalApi[]>('/estados-operacionales')).map(mapEstado);

// Turno
export const obtenerTurnoActualRemoto = () => apiRequest<TurnoActualApi>('/turnos/actual');
export const iniciarTurnoRemoto = (body: Record<string, unknown>) => post<TurnoActualApi>('/turnos/iniciar', body);
export const finalizarTurnoRemoto = (body: Record<string, unknown>) => post<TurnoApi>('/turnos/finalizar', body);
export const registrarEstadoRemoto = (body: Record<string, unknown>) => post<{ id: number }>('/turnos/estados', body);
export const crearReporteRemoto = (body: Record<string, unknown>) => post<{ id: number }>('/reportes', body);

export const subirEvidenciaRemota = async (datos: {
  idCliente: string;
  idClienteReporte: string;
  fechaHora: string;
  uri: string;
  mimeType: string;
}) => {
  const form = new FormData();
  form.append('idCliente', datos.idCliente);
  form.append('idClienteReporte', datos.idClienteReporte);
  form.append('fechaHora', datos.fechaHora);
  await adjuntarFoto(form, 'archivo', datos.uri, datos.mimeType, `${datos.idCliente}.jpg`);
  return apiRequest<{ id: number }>('/evidencias', { method: 'POST', body: form }, TIMEOUT_SUBIDA_MS);
};
