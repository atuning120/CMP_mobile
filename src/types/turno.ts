export type CategoriaEstado = 'PRODUCTIVO' | 'DEMORA' | 'MANTENCION';

export interface EstadoOperacional {
  id: number;
  nombre: string;
  categoria: CategoriaEstado;
}

export interface TurnoEstadoActual {
  id: string; // idCliente del registro
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
  // UUID con que la app registró el turno; existe aunque nunca se haya sincronizado
  idCliente: string;
  // Id del servidor; null mientras el inicio no se sincroniza
  id: number | null;
  maquina: Maquina;
  area: Area | null;
  zona: ZonaTrabajo | null;
  horometroInicial: number;
  estado: EstadoTurno;
  estadoOperacionalActual: TurnoEstadoActual | null;
  historialEstados: { estado: EstadoOperacional; inicio: string; fin: string | null }[];
  cantidadEvidencias: number;
  fechaInicio: string; // ISO 8601
  sincronizado: boolean;
}

// Último turno del operador cerrado por el sistema al superar las 12 horas.
export interface TurnoCerradoAutomaticamente {
  idCliente: string | null;
  id: number | null;
  fechaInicio: string; // ISO 8601
  fechaFin: string | null; // ISO 8601
}

// Foto recién tomada con la cámara (uri temporal); se copia al almacenamiento de la app al guardarla
export interface FotoCapturada {
  uri: string;
  mimeType: string;
}

export interface IniciarTurnoDatos {
  maquina: Maquina;
  horometroInicial: number;
  area: Area;
  zona: ZonaTrabajo | null;
  instrucciones: string;
  foto: FotoCapturada | null;
}

export interface FinalizarTurnoDatos {
  horometroFinal: number;
  novedades: string;
  foto: FotoCapturada | null;
}

export interface UseTurnoActualResult {
  turno: TurnoActual | null;
  turnoCerradoAutomaticamente: TurnoCerradoAutomaticamente | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  iniciarTurno: (datos: IniciarTurnoDatos) => Promise<void>;
  // Devuelve el estado final: CERRADO_AUTO si el cierre ocurrió después de las 12 h
  finalizarTurno: (datos: FinalizarTurnoDatos) => Promise<EstadoTurno>;
  estadosCatalogo: EstadoOperacional[];
  updateEstadoActual: (nuevoEstado: EstadoOperacional) => void;
}
