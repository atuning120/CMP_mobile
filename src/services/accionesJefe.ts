import * as Crypto from 'expo-crypto';
import { getDb } from '../db/database';
import {
  actualizarPayload,
  completarOperacion,
  descartarOperacionesConClave,
  DuenoCola,
  duenoDeSesion,
  encolarAccionJefe,
  EstadoOperacion,
  hayOperacionesConClave,
  listarOperaciones,
  listarSiguientesConClave,
  listarTodasLasOperaciones,
  obtenerOperacion,
  OperacionPendiente,
  reactivarOperacion,
  TipoOperacion,
} from '../sync/colaSync';
import { listarRegistroAcciones, registrarAccion, type RegistroAccion } from '../db/registroAcciones';
import { describirOperacion, tramoDe, type Tramo } from '../sync/vigenciaAcciones';
import { emitirCambioDatos } from '../sync/eventos';
import { refrescarContadores, solicitarSincronizacion } from '../sync/syncEngine';
import { ErrorParaUsuario } from '../utils/errores';
import { ApiError } from './apiClient';
import { atenderAlerta, type Alerta, type AtencionAlerta } from './alertasService';
import { leerOperadorCache, leerSesion } from './authStorage';
import {
  cerrarTurnoDeMaquina,
  crearMaquina,
  editarMaquina,
  listarFlota,
  listarOperadoresAsignables,
  MAQUINA_MODIFICADA,
  SIN_TURNO_EN_CURSO,
  TURNO_YA_CERRADO,
  type CerrarTurnoApi,
  type CrearMaquinaApi,
  type EditarMaquinaApi,
  type MaquinaFlotaApi,
} from './flotaService';
import { conCambios, type MaquinaFlota, vistaDeNueva } from '../hooks/useFlotaResumen';

/*
 * Acciones del jefe de turno que se pueden hacer sin señal: atender alertas, cerrar el turno de un operador, cambiar el
 * estado, editar e incorporar máquinas. Se intentan enviar al momento; si el Backend no responde, quedan en la cola (src/sync/colaSync.ts) y el
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
  // El cierre del turno que a veces la precede (sacar de operación una máquina en uso) es otra operación, con su UUID
  idClienteCierre: string;
}

// Al confirmar por primera vez: los reintentos del mismo modal reutilizan la misma
export const nuevaAccion = (): AccionPreparada => ({
  idCliente: Crypto.randomUUID(),
  fechaAccion: new Date().toISOString(),
  idClienteCierre: Crypto.randomUUID(),
});

// El turno que el jefe de turno quería cerrar ya lo cerró otro (gana el primer cierre): no es un error, se le avisa
export const esTurnoYaCerrado = (error: unknown): error is ApiError =>
  error instanceof ApiError && (error.code === TURNO_YA_CERRADO || error.code === SIN_TURNO_EN_CURSO);

export type Resultado<T> = { enviada: true; respuesta: T } | { enviada: false };

// Detalle del aviso cuando la acción quedó guardada en el teléfono
export const DETALLE_SIN_SENAL = 'Sin señal: se envía automáticamente cuando hay conexión.';

/**
 * Envía la acción; sin señal (o si ya hay otra de la misma alerta o máquina esperando, para respetar el orden) la deja
 * en la cola. Un rechazo del Backend (4xx) se lanza para que el modal lo muestre, como en línea.
 */
const enviarOEncolar = async <T>(
  dueno: Extract<DuenoCola, { usuario: string }>,
  operacion: { tipo: TipoOperacion; clave: string; idCliente?: string; accion: AccionPreparada; payload: Record<string, unknown> },
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
    idEntidad: operacion.idCliente ?? operacion.accion.idCliente,
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
      payload: {
        idAlerta: alerta.id,
        comentario,
        atencionesVistas,
        autor: await nombreAutor(),
        resumen: `${alerta.operador} en ${alerta.maquina.nombre}`,
      },
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
    {
      tipo: 'EDITAR_MAQUINA',
      clave: claveMaquina(maquina.id),
      accion,
      payload: { idMaquina: maquina.id, codigo: maquina.codigo, datos, vista },
    },
    () => editarMaquina(maquina.id, conId),
  );
};

export type ResultadoCierre = { estado: 'cerrado' | 'en-cola' } | { estado: 'ya-cerrado'; mensaje: string };

/**
 * Cierra el turno en curso de la máquina (el que se ve en la tarjeta) con el horómetro final, para sacarla de operación.
 * Gana el primer cierre que llega al servidor: si el operador, otro jefe o el sistema lo cerraron antes, no es un error
 * y el cambio de estado que viene detrás sigue adelante; `mensaje` dice quién lo cerró y a qué hora.
 */
export const cerrarTurnoJefe = async (
  maquina: MaquinaFlota,
  horometroFinal: number,
  motivo: string,
  accion: AccionPreparada,
): Promise<ResultadoCierre> => {
  const dueno = await duenoActual();
  const datos: CerrarTurnoApi = { horometroFinal, motivo, ...(maquina.idTurnoActual !== null ? { idTurno: maquina.idTurnoActual } : {}) };
  const resultado = await enviarOEncolar(
    dueno,
    {
      tipo: 'CERRAR_TURNO',
      clave: claveMaquina(maquina.id),
      idCliente: accion.idClienteCierre,
      accion,
      payload: {
        idMaquina: maquina.id,
        codigo: maquina.codigo,
        operador: maquina.operadorEnTurno,
        datos,
        vista: { operadorEnTurno: null, idTurnoActual: null },
      },
    },
    async (): Promise<ResultadoCierre> => {
      try {
        await cerrarTurnoDeMaquina(maquina.id, { ...datos, idCliente: accion.idClienteCierre, fechaAccion: accion.fechaAccion });
        return { estado: 'cerrado' };
      } catch (error) {
        if (esTurnoYaCerrado(error)) return { estado: 'ya-cerrado', mensaje: error.message };
        throw error;
      }
    },
  );
  return resultado.enviada ? resultado.respuesta : { estado: 'en-cola' };
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
  const operacion = await obtenerOperacion(idOperacion);
  if (operacion) await descartarConRegistro([operacion]);
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
  const [cambios, cierres, creaciones] = await Promise.all([
    listarOperaciones(dueno, 'EDITAR_MAQUINA'),
    listarOperaciones(dueno, 'CERRAR_TURNO'),
    listarOperaciones(dueno, 'CREAR_MAQUINA'),
  ]);
  const ediciones = [...cambios, ...cierres].sort((a, b) => a.id - b.id);

  // Varias acciones sobre la misma máquina se aplican en orden; la primera rechazada es la que se informa
  const porMaquina = new Map<number, { vista: Partial<MaquinaFlota>; error: string | null; porConfirmar: boolean; clave: string }>();
  for (const op of ediciones) {
    const p = op.payload as { idMaquina: number; vista: Partial<MaquinaFlota> };
    const previo = porMaquina.get(p.idMaquina);
    porMaquina.set(p.idMaquina, {
      vista: { ...previo?.vista, ...p.vista },
      error: previo?.error ?? (op.estado === 'ERROR' ? op.ultimoError : null),
      porConfirmar: (previo?.porConfirmar ?? false) || op.estado === 'REQUIERE_CONFIRMACION',
      clave: op.claveBloqueo ?? claveMaquina(p.idMaquina),
    });
  }
  const existentes = new Map<number, (maquina: MaquinaFlota) => MaquinaFlota>();
  porMaquina.forEach(({ vista, error, porConfirmar, clave }, idMaquina) =>
    existentes.set(idMaquina, (maquina) => ({ ...conCambios(maquina, vista), pendiente: { clave, error, porConfirmar, nueva: false } })),
  );

  const nuevas = creaciones.map((op) => {
    const p = op.payload as { datos: CrearMaquinaApi; operadorAsignado: string | null };
    return {
      ...vistaDeNueva(-op.id, p.datos, p.operadorAsignado),
      pendiente: {
        clave: op.claveBloqueo ?? '',
        error: op.estado === 'ERROR' ? op.ultimoError : null,
        porConfirmar: op.estado === 'REQUIERE_CONFIRMACION',
        nueva: true,
      },
    };
  });
  return { existentes, nuevas, ids: [...ediciones, ...creaciones].map((op) => op.id) };
};

// El jefe de turno descarta lo que no se ha enviado de una máquina (todas sus acciones en espera)
export const descartarCambiosPendientes = async (clave: string) => {
  const dueno = await duenoActual();
  const operaciones = (await listarTodasLasOperaciones(dueno)).filter((op) => op.claveBloqueo === clave);
  await registrarDescartadas(dueno.usuario, operaciones);
  await descartarOperacionesConClave(dueno, clave);
  emitirCambioDatos();
  await refrescarContadores();
};

// Lo que el jefe de turno descartó queda en el registro local, con por qué estaba detenida
const registrarDescartadas = async (usuario: string, operaciones: OperacionPendiente[]) => {
  for (const op of operaciones) {
    await registrarAccion(usuario, {
      evento: 'DESCARTADA',
      tipo: op.tipo,
      descripcion: describirOperacion(op),
      detalle: op.ultimoError ?? (op.estado === 'REQUIERE_CONFIRMACION' ? 'Esperaba confirmación' : 'Aún no se enviaba'),
      fechaAccion: op.fechaAccion,
    });
  }
};

const descartarConRegistro = async (operaciones: OperacionPendiente[]) => {
  const dueno = await duenoActual();
  await registrarDescartadas(dueno.usuario, operaciones);
  for (const op of operaciones) await completarOperacion(op.id);
  emitirCambioDatos();
  await refrescarContadores();
};

// Una acción de la bandeja "Acciones pendientes"
export interface AccionEnBandeja {
  id: number;
  tipo: TipoOperacion;
  descripcion: string;
  fechaAccion: string | null;
  estado: EstadoOperacion;
  tramo: Tramo;
  error: string | null;
  // Otro jefe de turno cambió la máquina (o movió al operador): se puede aplicar sobre cómo quedó
  esConflicto: boolean;
  // Espera a otra de la misma máquina o alerta que está detenida
  enEspera: boolean;
}

export const listarBandeja = async (): Promise<{ acciones: AccionEnBandeja[]; registro: RegistroAccion[] }> => {
  const dueno = duenoDeSesion(await leerSesion());
  if (!dueno || !('usuario' in dueno)) return { acciones: [], registro: [] };
  const [operaciones, registro] = await Promise.all([listarTodasLasOperaciones(dueno), listarRegistroAcciones(dueno.usuario)]);
  const detenidas = new Set<string>();
  const acciones = operaciones.map((op) => {
    const enEspera = !!op.claveBloqueo && detenidas.has(op.claveBloqueo);
    if (op.claveBloqueo && op.estado !== 'PENDIENTE') detenidas.add(op.claveBloqueo);
    return {
      id: op.id,
      tipo: op.tipo,
      descripcion: describirOperacion(op),
      fechaAccion: op.fechaAccion,
      estado: op.estado,
      tramo: tramoDe(op),
      error: op.estado === 'ERROR' ? op.ultimoError : null,
      esConflicto: op.estado === 'ERROR' && op.codigoError === MAQUINA_MODIFICADA,
      enEspera,
    };
  });
  return { acciones, registro };
};

const reactivar = async (operacion: OperacionPendiente, payload: Record<string, unknown>) => {
  // Confirmada por el jefe de turno: no vuelve a quedar en confirmación aunque tenga más de 24 h
  await reactivarOperacion(operacion.id, { ...payload, confirmada: true });
  emitirCambioDatos();
  await refrescarContadores();
  solicitarSincronizacion();
};

const operacionDeBandeja = async (id: number) => {
  const operacion = await obtenerOperacion(id);
  if (!operacion) throw new ErrorParaUsuario('La acción ya no está pendiente.');
  return operacion;
};

// "Enviar igual": una de más de 24 h que el jefe de turno confirma, o una rechazada que quiere reintentar tal cual
export const enviarIgual = async (id: number) => {
  const operacion = await operacionDeBandeja(id);
  await reactivar(operacion, operacion.payload);
};

/**
 * "Aplicar sobre el estado actual": otro jefe de turno cambió la máquina (o movió al operador) y este decide que su
 * cambio igual va. Se parte de la versión actual de la máquina y de dónde está hoy el operador; las acciones que
 * esperan detrás sobre la misma máquina también. Necesita conexión para leer cómo quedó.
 */
export const aplicarSobreEstadoActual = async (id: number) => {
  const operacion = await operacionDeBandeja(id);
  if (operacion.tipo !== 'EDITAR_MAQUINA') return reactivar(operacion, operacion.payload);
  const { idMaquina, datos } = operacion.payload as { idMaquina: number; datos: EditarMaquinaApi };

  const leer = async <T>(consulta: () => Promise<T>) => {
    try {
      return await consulta();
    } catch (error) {
      if (esFallaTransitoria(error)) throw new ErrorParaUsuario('Se necesita conexión para ver cómo quedó la máquina.');
      throw error;
    }
  };
  const actual = (await leer(() => listarFlota(''))).find((m) => m.idMaquina === idMaquina);
  if (!actual) throw new ErrorParaUsuario('La máquina ya no está en la flota.');
  const ajustada: EditarMaquinaApi = { ...datos, versionBase: actual.version ?? datos.versionBase };
  if (datos.idOperador && datos.valoresBase && 'maquinaOperador' in datos.valoresBase) {
    const operador = (await leer(listarOperadoresAsignables)).find((o) => o.idOperador === datos.idOperador);
    ajustada.valoresBase = { ...datos.valoresBase, maquinaOperador: operador?.maquinaAsignada?.idMaquina ?? null };
  }
  // Las siguientes sobre la misma máquina se prepararon sobre la misma versión vieja
  for (const siguiente of await listarSiguientesConClave(operacion)) {
    const suyos = siguiente.payload.datos as EditarMaquinaApi | undefined;
    if (siguiente.tipo === 'EDITAR_MAQUINA' && suyos?.versionBase === datos.versionBase) {
      await actualizarPayload(siguiente.id, { ...siguiente.payload, datos: { ...suyos, versionBase: ajustada.versionBase } });
    }
  }
  await reactivar(operacion, { ...operacion.payload, datos: ajustada });
};

export const descartarAccion = async (id: number) => {
  const operacion = await operacionDeBandeja(id);
  await descartarConRegistro([operacion]);
  solicitarSincronizacion();
};
