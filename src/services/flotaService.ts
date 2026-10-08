import { apiRequest } from './apiClient';

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
  estado: string | null; // 'ACTIVA' | 'BAJA'
  patente: string | null;
  anio: number | null;
  numeroChasis: string | null;
  esContratista: boolean;
  operadorAsignado: { idOperador: number; nombre: string } | null; // a cargo de la máquina
  operadorActual: string | null; // con turno en curso
  ubicacionActual: string | null;
  horometroActual: number | null;
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
  estado: 'ACTIVA' | 'BAJA';
  motivo: string;
  observacion: string | null;
}

export const editarMaquina = (idMaquina: number, datos: EditarMaquinaApi) =>
  apiRequest<MaquinaFlotaApi>(`/maquinas/${idMaquina}`, { method: 'PATCH', body: JSON.stringify(datos) });

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
