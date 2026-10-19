import { apiRequest } from './apiClient';
import type { EstadoMaquina } from '../constants/estadosMaquina';

/*
 * Vista del jefe de turno: trabaja en línea contra el Backend (no pasa por la base local ni por la
 * cola de sincronización, que son solo del operador).
 */

export interface MaquinaFlotaApi {
  idMaquina: number;
  nombre: string;
  marca: string | null;
  modelo: string | null;
  tipoMaquina: string | null;
  estado: string | null; // EstadoMaquina
  patente: string | null;
  anio: number | null;
  numeroChasis: string | null;
  esContratista: boolean;
  operadorAsignado: { idOperador: number; nombre: string } | null; // a cargo de la máquina
  operadorActual: string | null; // con turno en curso
  // Si no está ACTIVA: el motivo del último cambio de estado (o del reemplazo)
  motivoEstado: { motivo: string; observacion: string | null; fecha: string; reemplazadaPor: string | null } | null;
  ubicacionActual: string | null;
  horometroActual: number | null;
  // En mantenimiento o fuera de servicio: cuándo se espera que vuelva (ISO). Ausente en un Backend anterior
  regresoEstimado?: string | null;
  // Tras un reemplazo: la máquina que la cubre, o (en el respaldo) la original a la que cubre
  respaldo?: { idMaquina: number; nombre: string; estadoAlDevolver: string } | null;
  cubreA?: { idMaquina: number; nombre: string } | null;
}

export const listarFlota = (busqueda: string) => {
  const texto = busqueda.trim();
  const query = texto ? `?busqueda=${encodeURIComponent(texto)}` : '';
  return apiRequest<MaquinaFlotaApi[]>(`/maquinas/flota${query}`);
};

export interface CrearMaquinaApi {
  nombre: string;
  marca: string;
  modelo: string;
  tipoMaquina: string;
  anio: number | null;
  patente: string | null;
  numeroChasis: string | null;
  horometroInicial: number;
  esContratista: boolean;
  idOperador: number | null;
  motivo: string;
  observacion: string | null;
}

export const crearMaquina = (datos: CrearMaquinaApi) =>
  apiRequest<MaquinaFlotaApi>('/maquinas', { method: 'POST', body: JSON.stringify(datos) });

// Edición de la ficha: solo se envían los campos editables; el motivo queda en la bitácora
export interface EditarMaquinaApi {
  nombre: string;
  marca: string;
  modelo: string;
  tipoMaquina: string;
  anio: number | null;
  patente: string | null;
  numeroChasis: string | null;
  esContratista: boolean;
  idOperador: number | null; // null deja la máquina sin operador
  estado?: EstadoMaquina; // solo si cambia
  regresoEstimado?: string | null; // ISO; solo en mantenimiento o fuera de servicio
  motivo: string;
  observacion: string | null;
}

export const editarMaquina = (idMaquina: number, datos: EditarMaquinaApi) =>
  apiRequest<MaquinaFlotaApi>(`/maquinas/${idMaquina}`, { method: 'PATCH', body: JSON.stringify(datos) });

// Operador que se puede asignar a una máquina, con la que tiene hoy (al asignarlo a otra, se mueve)
// Cambio de estado: el mismo PATCH, enviando solo el estado (lo demás no se toca)
// regresoEstimado (ISO) solo en mantenimiento o fuera de servicio; undefined no lo toca
export const cambiarEstadoMaquina = (
  idMaquina: number,
  estado: EstadoMaquina,
  motivo: string,
  observacion: string | null,
  regresoEstimado?: string | null,
) =>
  apiRequest<MaquinaFlotaApi>(`/maquinas/${idMaquina}`, {
    method: 'PATCH',
    body: JSON.stringify({ estado, motivo, observacion, regresoEstimado }),
  });

// Reemplazo: la entrante es una de la flota o una nueva; sin idOperador, el de la saliente pasa a la entrante
export interface ReemplazarMaquinaApi {
  idMaquinaEntrante?: number;
  maquinaNueva?: Omit<CrearMaquinaApi, 'motivo' | 'observacion' | 'idOperador'>;
  idOperador: number | null;
  // Cómo queda la saliente y cuándo se espera que vuelva (ISO)
  estadoSaliente: 'EN_MANTENIMIENTO' | 'BAJA';
  regresoEstimado: string | null;
  motivo: string;
  observacion: string | null;
}

export const reemplazarMaquina = (idSaliente: number, datos: ReemplazarMaquinaApi) =>
  apiRequest<{ saliente: MaquinaFlotaApi; entrante: MaquinaFlotaApi }>(`/maquinas/${idSaliente}/reemplazo`, {
    method: 'POST',
    body: JSON.stringify(datos),
  });

// La original vuelve a operar con el operador de su respaldo, y el respaldo vuelve a su estado anterior
export const devolverMaquina = (idMaquina: number, motivo: string, observacion: string | null) =>
  apiRequest<{ original: MaquinaFlotaApi; respaldo: MaquinaFlotaApi }>(`/maquinas/${idMaquina}/devolucion`, {
    method: 'POST',
    body: JSON.stringify({ motivo, observacion }),
  });

// Cierra el turno en curso de la máquina en nombre del operador (para sacarla de operación). El horómetro final
// lo obtiene el jefe de turno en terreno o por radio
export const cerrarTurnoDeMaquina = (idMaquina: number, horometroFinal: number, motivo: string) =>
  apiRequest<unknown>(`/turnos/maquina/${idMaquina}/cierre`, { method: 'POST', body: JSON.stringify({ horometroFinal, motivo }) });

export interface OperadorAsignableApi {
  idOperador: number;
  nombre: string;
  rut: string;
  maquinaAsignada: { idMaquina: number; nombre: string } | null;
}

export const listarOperadoresAsignables = () => apiRequest<OperadorAsignableApi[]>('/maquinas/operadores');

export interface ModeloMaquinaApi {
  idModelo: number;
  nombre: string;
  marca: string;
  modelo: string;
  tipoMaquina: string;
}

export const listarModelosMaquina = () => apiRequest<ModeloMaquinaApi[]>('/modelos-maquina');

export const listarTiposMaquina = () => apiRequest<string[]>('/maquinas/tipos');

export const listarMarcasMaquina = () => apiRequest<string[]>('/maquinas/marcas');
