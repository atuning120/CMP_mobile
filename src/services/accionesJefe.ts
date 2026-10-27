import * as Crypto from 'expo-crypto';
import { getDb } from '../db/database';
import {
  completarOperacion,
  descartarOperacionesConClave,
  DuenoCola,
  duenoDeSesion,
  encolarAccionJefe,
  hayOperacionesConClave,
  listarOperaciones,
  TipoOperacion,
} from '../sync/colaSync';
import { emitirCambioDatos } from '../sync/eventos';
import { refrescarContadores, solicitarSincronizacion } from '../sync/syncEngine';
import { ErrorParaUsuario } from '../utils/errores';
import { ApiError } from './apiClient';
import { atenderAlerta, type Alerta, type AtencionAlerta } from './alertasService';
import { leerOperadorCache, leerSesion } from './authStorage';
import { crearMaquina, editarMaquina, type CrearMaquinaApi, type EditarMaquinaApi, type MaquinaFlotaApi } from './flotaService';
import { conCambios, type MaquinaFlota, vistaDeNueva } from '../hooks/useFlotaResumen';

/*
 * Acciones del jefe de turno que se pueden hacer sin señal: atender alertas, cambiar el estado, editar e incorporar
 * máquinas. Se intentan enviar al momento; si el Backend no responde, quedan en la cola (src/sync/colaSync.ts) y el
 * motor de sincronización las envía al volver la red, con la fecha en que se hicieron. Las de una misma alerta o
 * máquina van en orden: si una queda rechazada (p. ej. otro jefe cambió la máquina), las siguientes esperan.
 * Las pantallas llaman a estas funciones, nunca a la cola directamente. Reemplazo y devolución son solo en línea.
 */

// Sin señal, timeout o servidor caído: reenviarla más tarde puede funcionar. Un 4xx no cambiará
const esFallaTransitoria = (error: unknown) =>
  error instanceof ApiError && (error.status === 0 || error.status === 408 || error.status === 429 || error.status >= 500);

const claveAlerta = (idAlerta: string) => `alerta:${idAlerta}`;
export const claveMaquina = (idMaquina: number) => `maquina:${idMaquina}`;
const claveMaquinaNueva = (idCliente: string) => `maquina-nueva:${idCliente}`;

const duenoActual = async () => {
  const dueno = duenoDeSesion(await leerSesion());
  if (!dueno || !('usuario' in dueno)) throw new ErrorParaUsuario('Tu sesión expiró. Vuelve a iniciar sesión.');
  return dueno;
};

// Identifica una acción preparada en un modal: el mismo UUID y fecha en cada reintento
export interface AccionPreparada {
  idCliente: string;
  fechaAccion: string; // ISO: cuándo la hizo el jefe de turno
}

// Al confirmar por primera vez: los reintentos del mismo modal reutilizan la misma
export const nuevaAccion = (): AccionPreparada => ({ idCliente: Crypto.randomUUID(), fechaAccion: new Date().toISOString() });

export type Resultado<T> = { enviada: true; respuesta: T } | { enviada: false };

// Detalle del aviso cuando la acción quedó guardada en el teléfono
export const DETALLE_SIN_SENAL = 'Sin señal: se envía automáticamente cuando hay conexión.';

/**
 * Envía la acción; sin señal (o si ya hay otra de la misma alerta o máquina esperando, para respetar el orden) la deja
 * en la cola. Un rechazo del Backend (4xx) se lanza para que el modal lo muestre, como en línea.
 */
const enviarOEncolar = async <T>(
  dueno: Extract<DuenoCola, { usuario: string }>,
  operacion: { tipo: TipoOperacion; clave: string; accion: AccionPreparada; payload: Record<string, unknown> },
  enviar: () => Promise<T>,
): Promise<Resultado<T>> => {
  if (!(await hayOperacionesConClave(dueno, operacion.clave))) {
    try {
      return { enviada: true, respuesta: await enviar() };
    } catch (error) {
      if (!esFallaTransitoria(error)) throw error;
    }
  }
  await encolarAccionJefe(await getDb(), {
    tipo: operacion.tipo,
    idEntidad: operacion.accion.idCliente,
    usuario: dueno.usuario,
    claveBloqueo: operacion.clave,
    fechaAccion: operacion.accion.fechaAccion,
    payload: operacion.payload,
  });
  emitirCambioDatos();
  await refrescarContadores();
  solicitarSincronizacion();
  return { enviada: false };
};

// Nombre con que se muestra una atención aún no enviada (el Backend usará el del usuario)
const nombreAutor = async () => {
  const perfil = await leerOperadorCache();
  return [perfil?.nombre, perfil?.apellido].filter(Boolean).join(' ') || 'Tú';
};

/**
 * Atiende la alerta o le agrega una nota. Con conexión devuelve sus atenciones; sin conexión queda en la cola y la
 * tarjeta la muestra como pendiente de envío. Las notas no vencen.
 */
export const atenderAlertaJefe = async (alerta: Alerta, comentario: string, accion: AccionPreparada): Promise<Resultado<AtencionAlerta[]>> => {
  const dueno = await duenoActual();
  // Incluye las de este teléfono aún no enviadas: llegarán antes que esta
  const atencionesVistas = alerta.atenciones?.length ?? 0;
  const resultado = await enviarOEncolar(
    dueno,
    {
      tipo: 'ATENDER_ALERTA',
      clave: claveAlerta(alerta.id),
      accion,
      payload: { idAlerta: alerta.id, comentario, atencionesVistas, autor: await nombreAutor() },
    },
    () => atenderAlerta(alerta.id, comentario, accion.idCliente, atencionesVistas),
  );
  return resultado.enviada ? { enviada: true, respuesta: resultado.respuesta.atenciones } : resultado;
};

/**
 * Cambia el estado o edita la ficha de una máquina (el mismo PATCH). datos: solo lo que cambia, con versionBase y
 * valoresBase. vista: cómo se ve la máquina con el cambio, para mostrarla así mientras no se envía.
 */
export const editarMaquinaJefe = async (
  maquina: MaquinaFlota,
  datos: EditarMaquinaApi,
  vista: Partial<MaquinaFlota>,
  accion: AccionPreparada,
): Promise<Resultado<MaquinaFlotaApi>> => {
  const dueno = await duenoActual();
  const conId = { ...datos, idCliente: accion.idCliente };
  return enviarOEncolar(
    dueno,
    { tipo: 'EDITAR_MAQUINA', clave: claveMaquina(maquina.id), accion, payload: { idMaquina: maquina.id, datos, vista } },
    () => editarMaquina(maquina.id, conId),
  );
};

/** Incorpora una máquina. operadorAsignado: el nombre del operador elegido, para mostrarla mientras no se envía. */
export const crearMaquinaJefe = async (
  datos: CrearMaquinaApi,
  operadorAsignado: string | null,
  accion: AccionPreparada,
): Promise<Resultado<MaquinaFlotaApi>> => {
  const dueno = await duenoActual();
  const conId = { ...datos, idCliente: accion.idCliente };
  return enviarOEncolar(
    dueno,
    { tipo: 'CREAR_MAQUINA', clave: claveMaquinaNueva(accion.idCliente), accion, payload: { datos, operadorAsignado } },
    () => crearMaquina(conId),
  );
};

export interface AtencionPendiente {
  idAlerta: string;
  atencion: AtencionAlerta;
}

// Atenciones hechas sin señal que aún no llegan al Backend, en el orden en que se hicieron
export const listarAtencionesPendientes = async (): Promise<AtencionPendiente[]> => {
  const dueno = duenoDeSesion(await leerSesion());
  if (!dueno || !('usuario' in dueno)) return [];
  const operaciones = await listarOperaciones(dueno, 'ATENDER_ALERTA');
  return operaciones.map((op) => {
    const p = op.payload as { idAlerta: string; comentario: string; autor: string };
    return {
      idAlerta: p.idAlerta,
      atencion: {
        usuario: p.autor,
        fecha: op.fechaAccion ?? new Date().toISOString(),
        comentario: p.comentario || null,
        pendiente: { idOperacion: op.id, error: op.estado === 'ERROR' ? op.ultimoError : null },
      },
    };
  });
};

// El jefe de turno descarta una atención que el servidor rechazó (o que ya no quiere enviar)
export const descartarAtencionPendiente = async (idOperacion: number) => {
  await completarOperacion(idOperacion);
  emitirCambioDatos();
  await refrescarContadores();
  // Las que esperaban detrás de ella (misma alerta) ya pueden enviarse
  solicitarSincronizacion();
};

export interface CambiosPendientesFlota {
  // Máquinas existentes con cambios sin enviar: cómo se ven con ellos aplicados
  existentes: Map<number, (maquina: MaquinaFlota) => MaquinaFlota>;
  // Incorporadas sin señal: aún no existen en el Backend
  nuevas: MaquinaFlota[];
  // Operaciones en la cola: si alguna desaparece, se envió (o se descartó)
  ids: number[];
}

// Lo que el jefe de turno hizo sin señal sobre la flota y aún no llega al Backend
export const listarCambiosPendientesFlota = async (): Promise<CambiosPendientesFlota> => {
  const vacio: CambiosPendientesFlota = { existentes: new Map(), nuevas: [], ids: [] };
  const dueno = duenoDeSesion(await leerSesion());
  if (!dueno || !('usuario' in dueno)) return vacio;
  const [ediciones, creaciones] = await Promise.all([listarOperaciones(dueno, 'EDITAR_MAQUINA'), listarOperaciones(dueno, 'CREAR_MAQUINA')]);

  // Varias acciones sobre la misma máquina se aplican en orden; la primera rechazada es la que se informa
  const porMaquina = new Map<number, { vista: Partial<MaquinaFlota>; error: string | null; clave: string }>();
  for (const op of ediciones) {
    const p = op.payload as { idMaquina: number; vista: Partial<MaquinaFlota> };
    const previo = porMaquina.get(p.idMaquina);
    porMaquina.set(p.idMaquina, {
      vista: { ...previo?.vista, ...p.vista },
      error: previo?.error ?? (op.estado === 'ERROR' ? op.ultimoError : null),
      clave: op.claveBloqueo ?? claveMaquina(p.idMaquina),
    });
  }
  const existentes = new Map<number, (maquina: MaquinaFlota) => MaquinaFlota>();
  porMaquina.forEach(({ vista, error, clave }, idMaquina) =>
    existentes.set(idMaquina, (maquina) => ({ ...conCambios(maquina, vista), pendiente: { clave, error, nueva: false } })),
  );

  const nuevas = creaciones.map((op) => {
    const p = op.payload as { datos: CrearMaquinaApi; operadorAsignado: string | null };
    return {
      ...vistaDeNueva(-op.id, p.datos, p.operadorAsignado),
      pendiente: { clave: op.claveBloqueo ?? '', error: op.estado === 'ERROR' ? op.ultimoError : null, nueva: true },
    };
  });
  return { existentes, nuevas, ids: [...ediciones, ...creaciones].map((op) => op.id) };
};

// El jefe de turno descarta lo que no se ha enviado de una máquina (todas sus acciones en espera)
export const descartarCambiosPendientes = async (clave: string) => {
  const dueno = await duenoActual();
  await descartarOperacionesConClave(dueno, clave);
  emitirCambioDatos();
  await refrescarContadores();
};
