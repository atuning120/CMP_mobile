import { apiRequest } from './apiClient';
import type { EstadoMaquina } from '../constants/estadosMaquina';

/*
 * API de la flota del jefe de turno. Las pantallas no llaman aquí para incorporar, editar o cambiar el estado: lo hacen
 * por src/services/accionesJefe.ts, que deja la acción en la cola si no hay señal. Reemplazo y devolución son solo en
 * línea. Lo último consultado se guarda para verlo sin señal (src/db/consultaLocal.ts).
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
  idTurnoActual?: number | null; // ese turno (ausente en un Backend anterior)
  // Si no está ACTIVA: el motivo del último cambio de estado (o del reemplazo)
  motivoEstado: { motivo: string; observacion: string | null; fecha: string; reemplazadaPor: string | null } | null;
  ubicacionActual: string | null;
  horometroActual: number | null;
  // En mantenimiento o fuera de servicio: cuándo se espera que vuelva (ISO). Ausente en un Backend anterior
  regresoEstimado?: string | null;
  // Tras un reemplazo: la máquina que la cubre, o (en el respaldo) la original a la que cubre
  respaldo?: { idMaquina: number; nombre: string; estadoAlDevolver: string } | null;
  cubreA?: { idMaquina: number; nombre: string } | null;
  // Sube con cada acción de un jefe de turno. Ausente en un Backend anterior
  version?: number;
}

// versionBase (en editar, cambiar estado, reemplazar y devolver): la `version` de la máquina que vio el jefe de turno.
// Si otro la cambió mientras tanto, el Backend no aplica la acción y responde 409 con este código
export const MAQUINA_MODIFICADA = 'MAQUINA_MODIFICADA';

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
  idCliente?: string; // UUID generado al incorporarla: un reintento devuelve la misma máquina
  valoresBase?: { maquinaOperador: number | null }; // la máquina en que se vio al operador asignado
}

export const crearMaquina = (datos: CrearMaquinaApi) =>
  apiRequest<MaquinaFlotaApi>('/maquinas', { method: 'POST', body: JSON.stringify(datos) });

// Campos de la ficha que se editan uno a uno
export interface FichaMaquinaApi {
  nombre: string;
  marca: string;
  modelo: string;
  tipoMaquina: string;
  anio: number | null;
  patente: string | null;
  numeroChasis: string | null;
  esContratista: boolean;
  idOperador: number | null; // null deja la máquina sin operador
}

// Edición de la ficha y cambio de estado (el mismo PATCH): se envían solo los campos que cambian, y en valoresBase lo
// que se veía en cada uno. Si otro jefe de turno cambió la máquina mientras tanto, el Backend aplica igual los campos
// de la ficha que nadie tocó; el estado no se combina. El motivo queda en la bitácora
export interface EditarMaquinaApi extends Partial<FichaMaquinaApi> {
  estado?: EstadoMaquina; // solo si cambia
  regresoEstimado?: string | null; // ISO; solo en mantenimiento o fuera de servicio
  motivo: string;
  observacion: string | null;
  versionBase?: number;
  // maquinaOperador: la máquina en que se vio al operador que se asigna (si otro lo movió, es conflicto)
  valoresBase?: Partial<FichaMaquinaApi> & { maquinaOperador?: number | null };
  idCliente?: string; // UUID de esta acción: un reintento de una edición ya guardada no la repite
}

export const editarMaquina = (idMaquina: number, datos: EditarMaquinaApi) =>
  apiRequest<MaquinaFlotaApi>(`/maquinas/${idMaquina}`, { method: 'PATCH', body: JSON.stringify(datos) });

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
  versionBase?: number; // la de la saliente
}

export const reemplazarMaquina = (idSaliente: number, datos: ReemplazarMaquinaApi) =>
  apiRequest<{ saliente: MaquinaFlotaApi; entrante: MaquinaFlotaApi }>(`/maquinas/${idSaliente}/reemplazo`, {
    method: 'POST',
    body: JSON.stringify(datos),
  });

// La original vuelve a operar con el operador de su respaldo, y el respaldo vuelve a su estado anterior
export const devolverMaquina = (idMaquina: number, versionBase: number | undefined, motivo: string, observacion: string | null) =>
  apiRequest<{ original: MaquinaFlotaApi; respaldo: MaquinaFlotaApi }>(`/maquinas/${idMaquina}/devolucion`, {
    method: 'POST',
    body: JSON.stringify({ motivo, observacion, versionBase }),
  });

// Cierra el turno en curso de la máquina en nombre del operador (para sacarla de operación). El horómetro final
// lo obtiene el jefe de turno en terreno o por radio. idTurno: el que vio (sin señal, otro pudo empezar después);
// idCliente y fechaAccion: el mismo en cada reintento y cuándo tomó el horómetro. Las pantallas lo hacen por accionesJefe
export interface CerrarTurnoApi {
  horometroFinal: number;
  motivo: string;
  idTurno?: number;
  idCliente?: string;
  fechaAccion?: string;
}

export const cerrarTurnoDeMaquina = (idMaquina: number, datos: CerrarTurnoApi) =>
  apiRequest<unknown>(`/turnos/maquina/${idMaquina}/cierre`, { method: 'POST', body: JSON.stringify(datos) });

// Gana el primer cierre que llega al servidor: si el operador, otro jefe o el sistema lo cerraron antes, responde 409
// con este código y un mensaje con quién y a qué hora ("El turno ya fue cerrado por X a las HH:MM")
export const TURNO_YA_CERRADO = 'TURNO_YA_CERRADO';
// Un Backend anterior (o sin idTurno) responde este cuando la máquina ya no tiene turno en curso
export const SIN_TURNO_EN_CURSO = 'SIN_TURNO_EN_CURSO';

// Operador que se puede asignar a una máquina, con la que tiene hoy (al asignarlo a otra, se mueve)
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
