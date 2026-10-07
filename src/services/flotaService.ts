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
  operadorActual: string | null;
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
}

export const crearMaquina = (datos: CrearMaquinaApi) =>
  apiRequest<MaquinaFlotaApi>('/maquinas', { method: 'POST', body: JSON.stringify(datos) });
