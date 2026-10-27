import { getDb, guardarAjuste, leerAjuste } from '../db/database';
import { catalogoActualizadoEn, guardarCatalogo, TipoCatalogo } from '../db/catalogoLocal';
import {
  actualizarEstadoEvidencia,
  actualizarTurno,
  insertarEstado,
  insertarTurno,
  listarTurnosEnCurso,
  obtenerTurno,
  obtenerTurnoPorServidor,
} from '../db/turnoLocal';
import { ApiError } from '../services/apiClient';
import { FotoNoEncontradaError } from '../services/fotos';
import { FOTOS_HABILITADAS } from '../constants/features';
import { mensajeDeError } from '../utils/errores';
import { leerSesion } from '../services/authStorage';
import * as api from '../services/turnoService';
import { atenderAlerta } from '../services/alertasService';
import {
  cerrarTurnoDeMaquina,
  crearMaquina,
  editarMaquina,
  SIN_TURNO_EN_CURSO,
  TURNO_YA_CERRADO,
  type CerrarTurnoApi,
  type CrearMaquinaApi,
  type EditarMaquinaApi,
} from '../services/flotaService';
import { mostrarAviso } from '../services/retroalimentacion';
import {
  actualizarPayload,
  completarOperacion,
  contarOperaciones,
  DuenoCola,
  duenoDeSesion,
  listarSiguientesConClave,
  marcarOperacionConError,
  OperacionPendiente,
  reprogramarOperacion,
  siguienteOperacion,
} from './colaSync';
import { actualizarEstadoSincronizacion, emitirCambioDatos } from './eventos';

/*
 * Motor de sincronización en segundo plano.
 *
 * 1. Envía la cola de operaciones (outbox) en orden. Cada operación lleva el UUID generado en el
 *    teléfono, por lo que reintentarla nunca duplica datos en el servidor.
 * 2. Con la cola vacía, trae del servidor lo que pudo cambiar fuera del teléfono (turno cerrado
 *    automáticamente o por el jefe de turno) y refresca los catálogos.
 *
 * Con la sesión de un jefe de turno solo envía su cola (lo que hizo sin señal, p. ej. atender una alerta).
 *
 * Nunca bloquea la UI: todo corre en promesas, una sola ejecución a la vez, y la UI se entera de
 * los cambios por eventos (src/sync/eventos.ts).
 */

const CATALOGO_VIGENCIA_MS = 30 * 60 * 1000;
// Subir este número cuando cambie el formato de un catálogo: los teléfonos lo vuelven a descargar
// (2: estados operacionales con descripción y esProductivo; 3: máquinas con su operador asignado;
// 4: máquinas con su último horómetro final)
const VERSION_CATALOGOS = 4;
// Una foto que no logra subirse se marca con error tras estos intentos (y deja de reintentarse sola)
const MAX_INTENTOS_EVIDENCIA = 8;
export const AVISO_CIERRE_AUTO = (idOperador: number) => `aviso_cierre_auto:${idOperador}`;
export const AVISO_CIERRE_JEFE = (idOperador: number) => `aviso_cierre_jefe:${idOperador}`;

type ResultadoEnvio = 'ok' | 'sin-conexion' | 'sin-sesion' | 'reintentar' | 'rechazada';

let ejecucionEnCurso: Promise<void> | null = null;
let solicitudPendiente = false;

// Queda en la operación y el operador lo ve al tocar los registros no sincronizados: nunca el texto técnico
const mensajeDe = (error: unknown) => mensajeDeError(error, 'Ocurrió un error inesperado al sincronizar.');

// Las operaciones referencian el turno por su UUID; los turnos que vinieron del servidor sin UUID usan "srv-<id>"
const referenciaTurno = (idClienteTurno: string) =>
  idClienteTurno.startsWith('srv-') ? { idTurno: Number(idClienteTurno.slice(4)) } : { idClienteTurno };

/**
 * Las siguientes acciones sobre la misma máquina se prepararon viendo la máquina con esta ya aplicada, pero con su
 * versión anterior. Si nadie más la cambió entremedio (subió exactamente una versión, la de esta), parten de la nueva;
 * si otro jefe de turno la cambió, conservan la vieja y el Backend decide si hay conflicto.
 */
const encadenarVersion = async (operacion: OperacionPendiente, versionAnterior: number | undefined, versionNueva: number | undefined) => {
  if (versionAnterior === undefined || versionNueva !== versionAnterior + 1) return;
  for (const siguiente of await listarSiguientesConClave(operacion)) {
    const datos = siguiente.payload.datos as EditarMaquinaApi | undefined;
    if (siguiente.tipo !== 'EDITAR_MAQUINA' || datos?.versionBase !== versionAnterior) continue;
    await actualizarPayload(siguiente.id, { ...siguiente.payload, datos: { ...datos, versionBase: versionNueva } });
  }
};

const enviarOperacion = async (operacion: OperacionPendiente): Promise<void> => {
  const p = operacion.payload;
  const db = await getDb();

  switch (operacion.tipo) {
    case 'INICIAR_TURNO': {
      const respuesta = await api.iniciarTurnoRemoto(p);
      if (respuesta.turno) {
        await actualizarTurno(db, operacion.idEntidad, {
          idServidor: respuesta.turno.id,
          sincronizado: true,
          conflicto: respuesta.turno.conflicto,
        });
      }
      return;
    }
    case 'FINALIZAR_TURNO': {
      const { idClienteTurno, ...resto } = p as { idClienteTurno: string } & Record<string, unknown>;
      const turno = await api.finalizarTurnoRemoto({ ...resto, ...referenciaTurno(idClienteTurno) });
      // El servidor es la autoridad sobre el resultado (p. ej. CERRADO_AUTO si pasó de 13 h)
      await actualizarTurno(db, idClienteTurno, { estado: turno.estado, fechaFin: turno.fechaFin, horometroFinal: turno.horometroFinal });
      return;
    }
    case 'REGISTRAR_ESTADO': {
      const { idClienteTurno, ...resto } = p as { idClienteTurno: string } & Record<string, unknown>;
      await api.registrarEstadoRemoto({ ...resto, ...referenciaTurno(idClienteTurno) });
      return;
    }
    case 'CAMBIAR_UBICACION': {
      const { idClienteTurno, ...resto } = p as { idClienteTurno: string } & Record<string, unknown>;
      await api.cambiarUbicacionRemota({ ...resto, ...referenciaTurno(idClienteTurno) });
      return;
    }
    case 'CREAR_REPORTE': {
      const { idClienteTurno, ...resto } = p as { idClienteTurno: string } & Record<string, unknown>;
      await api.crearReporteRemoto({ ...resto, ...referenciaTurno(idClienteTurno) });
      return;
    }
    case 'SUBIR_EVIDENCIA': {
      await api.subirEvidenciaRemota(p as Parameters<typeof api.subirEvidenciaRemota>[0]);
      await actualizarEstadoEvidencia(operacion.idEntidad, 'SINCRONIZADO');
      return;
    }
    case 'ATENDER_ALERTA': {
      const { idAlerta, comentario, atencionesVistas } = p as { idAlerta: string; comentario: string; atencionesVistas: number };
      // Si la respuesta no llegó y se reenvía, el idCliente evita registrarla dos veces
      await atenderAlerta(idAlerta, comentario, operacion.idEntidad, atencionesVistas, operacion.fechaAccion ?? undefined);
      return;
    }
    case 'CERRAR_TURNO': {
      const { idMaquina, codigo, datos } = p as { idMaquina: number; codigo: string; datos: CerrarTurnoApi };
      try {
        await cerrarTurnoDeMaquina(idMaquina, { ...datos, idCliente: operacion.idEntidad, fechaAccion: operacion.fechaAccion ?? undefined });
      } catch (error) {
        // Gana el primer cierre: si el operador, otro jefe o el sistema lo cerraron antes, no es un error. Se avisa quién
        // y cuándo, y el cambio de estado que espera detrás sigue
        if (!(error instanceof ApiError && (error.code === TURNO_YA_CERRADO || error.code === SIN_TURNO_EN_CURSO))) throw error;
        mostrarAviso(error.message, { detalle: `Cierre de turno de ${codigo} hecho sin señal`, tipo: 'info' });
      }
      return;
    }
    case 'EDITAR_MAQUINA': {
      // También el cambio de estado. El idCliente evita aplicarla dos veces si la respuesta anterior no llegó
      const { idMaquina, datos } = p as { idMaquina: number; datos: EditarMaquinaApi };
      const respuesta = await editarMaquina(idMaquina, { ...datos, idCliente: operacion.idEntidad });
      await encadenarVersion(operacion, datos.versionBase, respuesta.version);
      return;
    }
    case 'CREAR_MAQUINA': {
      const { datos } = p as { datos: CrearMaquinaApi };
      await crearMaquina({ ...datos, idCliente: operacion.idEntidad });
      return;
    }
  }
};

const procesarCola = async (dueno: DuenoCola): Promise<ResultadoEnvio> => {
  for (;;) {
    const operacion = await siguienteOperacion(dueno);
    if (!operacion) return 'ok';

    // Fotos desactivadas: una subida que quedó en cola se descarta (la foto sigue en el teléfono)
    if (operacion.tipo === 'SUBIR_EVIDENCIA' && !FOTOS_HABILITADAS) {
      await completarOperacion(operacion.id);
      continue;
    }

    try {
      await enviarOperacion(operacion);
      await completarOperacion(operacion.id);
      emitirCambioDatos();
    } catch (error) {
      // Las fotos no tienen operaciones que dependan de ellas: si una falla, se reintenta aparte y
      // la cola sigue (un cierre de turno no puede quedar trabado detrás de una subida).
      if (operacion.tipo === 'SUBIR_EVIDENCIA' && !(error instanceof ApiError && (error.status === 401 || error.status >= 400 && error.status < 500))) {
        const definitivo = error instanceof FotoNoEncontradaError || operacion.intentos + 1 >= MAX_INTENTOS_EVIDENCIA;
        if (definitivo) {
          await marcarOperacionConError(operacion, mensajeDe(error));
          await actualizarEstadoEvidencia(operacion.idEntidad, 'ERROR_SINCRONIZACION');
        } else {
          await reprogramarOperacion(operacion, mensajeDe(error));
        }
        emitirCambioDatos();
        continue;
      }
      if (error instanceof ApiError) {
        if (error.status === 0) return 'sin-conexion';
        if (error.status === 401) return 'sin-sesion';
        // 4xx: el servidor rechazó los datos y reenviarlos no cambiará el resultado
        if (error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429) {
          await marcarOperacionConError(operacion, error.message);
          if (operacion.tipo === 'SUBIR_EVIDENCIA') await actualizarEstadoEvidencia(operacion.idEntidad, 'ERROR_SINCRONIZACION');
          emitirCambioDatos();
          continue;
        }
      }
      // 5xx, timeout u otro error inesperado: se reintenta más tarde sin alterar el orden de la cola
      await reprogramarOperacion(operacion, mensajeDe(error));
      return 'reintentar';
    }
  }
};

/**
 * Trae del servidor el turno vigente y concilia con el teléfono. Solo se ejecuta con la cola vacía:
 * mientras haya operaciones locales sin enviar, el teléfono manda.
 */
const conciliarTurno = async (idOperador: number) => {
  const remoto = await api.obtenerTurnoActualRemoto();
  const db = await getDb();
  const enCursoLocales = await listarTurnosEnCurso(idOperador);
  const cerradoAuto = remoto.turnoCerradoAutomaticamente;
  const cerradoJefe = remoto.turnoCerradoPorJefe ?? null;
  let cambios = false;

  const turnoRemoto = remoto.turno;
  let idClienteVigente: string | null = null;

  if (turnoRemoto) {
    const local =
      (turnoRemoto.idCliente ? await obtenerTurno(turnoRemoto.idCliente) : null) ?? (await obtenerTurnoPorServidor(turnoRemoto.id));
    if (local) {
      idClienteVigente = local.idCliente;
      if (local.idServidor !== turnoRemoto.id || !local.sincronizado) {
        await actualizarTurno(db, local.idCliente, { idServidor: turnoRemoto.id, sincronizado: true });
        cambios = true;
      }
    } else if (turnoRemoto.maquina) {
      // Turno abierto fuera de este teléfono (otro dispositivo o versión anterior de la app)
      idClienteVigente = turnoRemoto.idCliente ?? `srv-${turnoRemoto.id}`;
      await db.withExclusiveTransactionAsync(async (txn) => {
        await insertarTurno(txn, {
          idCliente: idClienteVigente!,
          idServidor: turnoRemoto.id,
          idOperador,
          maquina: api.mapMaquina(turnoRemoto.maquina!),
          area: turnoRemoto.area ? api.mapArea(turnoRemoto.area) : null,
          zona: turnoRemoto.zona ? api.mapZona(turnoRemoto.zona) : null,
          fechaInicio: turnoRemoto.fechaInicio,
          fechaFin: null,
          horometroInicial: turnoRemoto.horometroInicial,
          horometroFinal: null,
          estado: 'EN_CURSO',
          sincronizado: true,
        });
        for (const registro of turnoRemoto.historialEstados) {
          if (!registro.estado) continue;
          await insertarEstado(txn, {
            idCliente: registro.idCliente ?? `srv-${idClienteVigente}-${registro.inicio}`,
            idClienteTurno: idClienteVigente!,
            estado: api.mapEstado(registro.estado),
            inicio: registro.inicio,
            fin: registro.fin,
          });
        }
      });
      cambios = true;
    }
  }

  // Turnos que el teléfono cree abiertos pero el servidor ya cerró (13 h o jefe de turno).
  // Solo los ya sincronizados: uno que nunca llegó al servidor sigue siendo válido localmente.
  const esElMismo = (remotoCerrado: typeof cerradoAuto, local: (typeof enCursoLocales)[number]) =>
    remotoCerrado && ((remotoCerrado.idCliente && remotoCerrado.idCliente === local.idCliente) || remotoCerrado.id === local.idServidor);
  for (const local of enCursoLocales) {
    if (local.idCliente === idClienteVigente || !local.sincronizado) continue;
    // Si lo cerró el servidor, se copian su estado, término y horómetro (el jefe de turno lo informa)
    const cerrado = esElMismo(cerradoJefe, local) ? cerradoJefe : esElMismo(cerradoAuto, local) ? cerradoAuto : null;
    await actualizarTurno(db, local.idCliente, {
      estado: cerrado ? cerrado.estado : 'CERRADO',
      fechaFin: cerrado?.fechaFin ?? new Date().toISOString(),
      ...(cerrado?.horometroFinal !== null && cerrado?.horometroFinal !== undefined ? { horometroFinal: cerrado.horometroFinal } : {}),
    });
    await db.runAsync('UPDATE turno_estado SET fin = ? WHERE id_cliente_turno = ? AND fin IS NULL', [new Date().toISOString(), local.idCliente]);
    cambios = true;
  }

  if (!turnoRemoto) {
    await guardarAjuste(
      AVISO_CIERRE_AUTO(idOperador),
      cerradoAuto ? { idCliente: cerradoAuto.idCliente, id: cerradoAuto.id, fechaInicio: cerradoAuto.fechaInicio, fechaFin: cerradoAuto.fechaFin } : null,
    );
    await guardarAjuste(
      AVISO_CIERRE_JEFE(idOperador),
      cerradoJefe
        ? {
            idCliente: cerradoJefe.idCliente,
            id: cerradoJefe.id,
            fechaInicio: cerradoJefe.fechaInicio,
            fechaFin: cerradoJefe.fechaFin,
            horometroFinal: cerradoJefe.horometroFinal,
            motivo: cerradoJefe.motivoCierre ?? null,
          }
        : null,
    );
    cambios = true;
  }

  if (cambios) emitirCambioDatos();
};

const CATALOGOS: { tipo: TipoCatalogo; cargar: () => Promise<{ id: number }[]>; padre?: (item: never) => number }[] = [
  { tipo: 'maquina', cargar: api.listarMaquinasActivas },
  { tipo: 'area', cargar: api.listarAreasActivas },
  { tipo: 'zona', cargar: api.listarZonasActivas, padre: (zona: { idArea: number }) => zona.idArea },
  { tipo: 'estado', cargar: api.listarEstadosOperacionales },
];

/**
 * Descarga los catálogos (máquinas, áreas, zonas, estados) para poder trabajar offline.
 * tipos: solo esos catálogos (p. ej. las máquinas al abrir el inicio de turno)
 */
export const sincronizarCatalogos = async (forzar = false, tipos?: TipoCatalogo[]) => {
  const versionGuardada = await leerAjuste<number>('catalogo_version');
  if (versionGuardada !== VERSION_CATALOGOS) forzar = true;
  let cambios = false;
  for (const catalogo of CATALOGOS) {
    if (tipos && !tipos.includes(catalogo.tipo)) continue;
    const actualizado = await catalogoActualizadoEn(catalogo.tipo);
    if (!forzar && actualizado && Date.now() - actualizado.getTime() < CATALOGO_VIGENCIA_MS) continue;
    const items = await catalogo.cargar();
    await guardarCatalogo(catalogo.tipo, items, catalogo.padre as ((item: { id: number }) => number) | undefined);
    cambios = true;
  }
  // Una descarga parcial no deja al día los demás catálogos: la versión se marca solo con la completa
  if (!tipos && versionGuardada !== VERSION_CATALOGOS) await guardarAjuste('catalogo_version', VERSION_CATALOGOS);
  if (cambios) emitirCambioDatos();
};

const actualizarContadores = async (dueno: DuenoCola) => {
  const { pendientes, errores } = await contarOperaciones(dueno);
  actualizarEstadoSincronizacion({ pendientes, errores });
};

const ejecutar = async () => {
  const dueno = duenoDeSesion(await leerSesion());
  if (!dueno) return;

  actualizarEstadoSincronizacion({ sincronizando: true });
  try {
    const resultado = await procesarCola(dueno);
    await actualizarContadores(dueno);
    if (resultado !== 'ok') {
      if (resultado === 'reintentar') actualizarEstadoSincronizacion({ ultimoError: 'El servidor no respondió; se reintentará.' });
      return;
    }

    const { pendientes } = await contarOperaciones(dueno);
    if (pendientes === 0 && 'idOperador' in dueno) {
      await conciliarTurno(dueno.idOperador);
      await sincronizarCatalogos();
    }
    actualizarEstadoSincronizacion({ ultimaSincronizacion: new Date().toISOString(), ultimoError: null });
  } catch (error) {
    // Sin red o servidor caído durante la conciliación: no es un error para el operador
    if (!(error instanceof ApiError && (error.status === 0 || error.status === 401))) {
      console.warn('Error de sincronización', error);
      actualizarEstadoSincronizacion({ ultimoError: mensajeDe(error) });
    }
  } finally {
    actualizarEstadoSincronizacion({ sincronizando: false });
  }
};

/**
 * Ejecuta una sincronización. Si ya hay una en curso, agenda otra al terminar (para no perder
 * operaciones encoladas mientras tanto) y devuelve la promesa de la ejecución completa.
 */
export const sincronizar = (): Promise<void> => {
  if (ejecucionEnCurso) {
    solicitudPendiente = true;
    return ejecucionEnCurso;
  }
  ejecucionEnCurso = (async () => {
    do {
      solicitudPendiente = false;
      await ejecutar();
    } while (solicitudPendiente);
  })().finally(() => {
    ejecucionEnCurso = null;
  });
  return ejecucionEnCurso;
};

// Para la UI: dispara la sincronización sin esperarla
export const solicitarSincronizacion = () => {
  void sincronizar();
};

// Sincronización en curso (o null). Permite a una pantalla esperar a que el servidor confirme los datos
export const sincronizacionEnCurso = (): Promise<void> | null => ejecucionEnCurso;

export const refrescarContadores = async () => {
  const dueno = duenoDeSesion(await leerSesion());
  if (dueno) await actualizarContadores(dueno);
};
