import { apiRequest } from './apiClient';
import { Area, EstadoTurno, IniciarTurnoDatos, Maquina, TurnoActual, TurnoCerradoAutomaticamente, ZonaTrabajo } from '../types/turno';

// Contratos del Backend (módulos turnos, maquinas y geocercas)
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
}

interface TurnoApi {
  id: number;
  idOperador: number;
  idMaquina: number;
  estado: EstadoTurno;
  fechaInicio: string;
  fechaFin: string | null;
  horometroInicial: number;
  horometroFinal: number | null;
}

interface TurnoActualApi {
  turno: (TurnoApi & { maquina: MaquinaApi | null; area: AreaApi | null; zona: ZonaTrabajoApi | null }) | null;
  turnoCerradoAutomaticamente: TurnoApi | null;
}

export interface TurnoActualResponse {
  turno: TurnoActual | null;
  turnoCerradoAutomaticamente: TurnoCerradoAutomaticamente | null;
}

const mapMaquina = (maquina: MaquinaApi): Maquina => ({
  id: maquina.idMaquina,
  codigoCorto: maquina.nombre,
  nombreCompleto: [maquina.tipoMaquina, maquina.modelo].filter(Boolean).join(' ') || maquina.nombre,
  tipoMaquina: maquina.tipoMaquina ?? '',
  modelo: maquina.modelo ?? '',
});

const mapArea = (area: AreaApi): Area => ({ id: area.idArea, nombre: area.nombre, descripcion: area.descripcion });

const mapZona = (zona: ZonaTrabajoApi): ZonaTrabajo => ({
  id: zona.idZona,
  idArea: zona.idArea,
  nombre: zona.nombre,
  descripcion: zona.descripcion,
});

const mapTurnoActual = (data: TurnoActualApi): TurnoActualResponse => ({
  turno: data.turno
    ? {
        id: data.turno.id,
        maquina: data.turno.maquina
          ? mapMaquina(data.turno.maquina)
          : { id: data.turno.idMaquina, codigoCorto: `#${data.turno.idMaquina}`, nombreCompleto: '', tipoMaquina: '', modelo: '' },
        area: data.turno.area ? mapArea(data.turno.area) : null,
        zona: data.turno.zona ? mapZona(data.turno.zona) : null,
        horometroInicial: data.turno.horometroInicial,
        estado: data.turno.estado,
        // El estado operacional aún no se registra en el Backend
        estadoOperacionalActual: null,
        historialEstados: [],
        cantidadEvidencias: 0,
        fechaInicio: data.turno.fechaInicio,
      }
    : null,
  turnoCerradoAutomaticamente: data.turnoCerradoAutomaticamente
    ? {
        id: data.turnoCerradoAutomaticamente.id,
        fechaInicio: data.turnoCerradoAutomaticamente.fechaInicio,
        fechaFin: data.turnoCerradoAutomaticamente.fechaFin,
      }
    : null,
});

export const obtenerTurnoActual = async (): Promise<TurnoActualResponse> =>
  mapTurnoActual(await apiRequest<TurnoActualApi>('/turnos/actual'));

export const iniciarTurno = async (datos: IniciarTurnoDatos): Promise<TurnoActualResponse> =>
  mapTurnoActual(
    await apiRequest<TurnoActualApi>('/turnos/iniciar', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),
  );

export const finalizarTurno = async (idTurno: number, horometroFinal: number): Promise<void> => {
  await apiRequest<TurnoApi>('/turnos/finalizar', {
    method: 'POST',
    body: JSON.stringify({ idTurno, horometroFinal }),
  });
};

export const listarAreasActivas = async (): Promise<Area[]> =>
  (await apiRequest<AreaApi[]>('/areas')).map(mapArea);

export const listarZonasPorArea = async (idArea: number): Promise<ZonaTrabajo[]> =>
  (await apiRequest<ZonaTrabajoApi[]>(`/areas/${idArea}/zonas`)).map(mapZona);

export const listarMaquinasActivas = async (): Promise<Maquina[]> =>
  (await apiRequest<MaquinaApi[]>('/maquinas')).map(mapMaquina);
