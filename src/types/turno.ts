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
  descripcion: string | null;
}

export interface ZonaTrabajo {
  id: number;
  idArea: number;
  nombre: string;
  descripcion: string | null;
}

export interface Maquina {
  id: number;
  codigoCorto: string;
  nombreCompleto: string;
  tipoMaquina: string;
  modelo: string;
}

export type EstadoTurno = 'EN_CURSO' | 'CERRADO' | 'CERRADO_AUTO';

export interface TurnoActual {
  id: number;
  maquina: Maquina;
  area: Area | null;
  zona: ZonaTrabajo | null;
  horometroInicial: number;
  estado: EstadoTurno;
  estadoOperacionalActual: TurnoEstadoActual | null;
  historialEstados: { estado: EstadoOperacional; inicio: string; fin: string | null }[];
  cantidadEvidencias: number;
  fechaInicio: string; // ISO 8601
}

// Último turno del operador cerrado por el sistema al superar las 12 horas.
export interface TurnoCerradoAutomaticamente {
  id: number;
  fechaInicio: string; // ISO 8601
  fechaFin: string | null; // ISO 8601
}

export interface IniciarTurnoDatos {
  idMaquina: number;
  horometroInicial: number;
  idArea: number;
  idZona: number | null;
}

export interface UseTurnoActualResult {
  turno: TurnoActual | null;
  turnoCerradoAutomaticamente: TurnoCerradoAutomaticamente | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  iniciarTurno: (datos: IniciarTurnoDatos) => Promise<void>;
  finalizarTurno: (horometroFinal: number) => Promise<void>;
  estadosCatalogo: EstadoOperacional[];
  updateEstadoActual: (nuevoEstado: EstadoOperacional) => void;
}
