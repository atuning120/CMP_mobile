export interface EstadoOperacional {
  id: number;
  nombre: string;
  categoria: 'PRODUCTIVO' | 'DEMORA' | 'MANTENCION';
}

export interface TurnoEstadoActual {
  id: number;
  estado: EstadoOperacional;
  inicio: string; // ISO 8601
}

export interface Area {
  id: number;
  nombre: string;
}

export interface Maquina {
  id: number;
  codigoCorto: string;
  nombreCompleto: string;
  tipoMaquina: string;
}

export interface TurnoActual {
  id: number;
  maquina: Maquina;
  area: Area;
  horometroInicial: number;
  estado: 'EN_CURSO' | 'CERRADO' | 'CERRADO_AUTO';
  estadoOperacionalActual: TurnoEstadoActual;
  historialEstados: { estado: EstadoOperacional; inicio: string; fin: string | null }[];
  cantidadEvidencias: number;
  fechaInicio: string; // ISO 8601
}

export interface UseTurnoActualResult {
  turno: TurnoActual | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  estadosCatalogo: EstadoOperacional[];
}
