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
import { leerSesion } from '../services/authStorage';
import * as api from '../services/turnoService';
import {
  completarOperacion,
  contarOperaciones,
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
 * Nunca bloquea la UI: todo corre en promesas, una sola ejecución a la vez, y la UI se entera de
 * los cambios por eventos (src/sync/eventos.ts).
 */

const CATALOGO_VIGENCIA_MS = 30 * 60 * 1000;
// Subir este número cuando cambie el formato de un catálogo: los teléfonos lo vuelven a descargar
// (2: estados operacionales con descripción y esProductivo)
const VERSION_CATALOGOS = 2;
// Una foto que no logra subirse se marca con error tras estos intentos (y deja de reintentarse sola)
const MAX_INTENTOS_EVIDENCIA = 8;
export const AVISO_CIERRE_AUTO = (idOperador: number) => `aviso_cierre_auto:${idOperador}`;

type ResultadoEnvio = 'ok' | 'sin-conexion' | 'sin-sesion' | 'reintentar' | 'rechazada';

let ejecucionEnCurso: Promise<void> | null = null;
let solicitudPendiente = false;

const mensajeDe = (error: unknown) => (error instanceof Error ? error.message : String(error));

// Las operaciones referencian el turno por su UUID; los turnos que vinieron del servidor sin UUID usan "srv-<id>"
const referenciaTurno = (idClienteTurno: string) =>
  idClienteTurno.startsWith('srv-') ? { idTurno: Number(idClienteTurno.slice(4)) } : { idClienteTurno };

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
      // El servidor es la autoridad sobre el resultado (p. ej. CERRADO_AUTO si pasó de 12 h)
      await actualizarTurno(db, idClienteTurno, { estado: turno.estado, fechaFin: turno.fechaFin, horometroFinal: turno.horometroFinal });
      return;
    }
    case 'REGISTRAR_ESTADO': {
      const { idClienteTurno, ...resto } = p as { idClienteTurno: string } & Record<string, unknown>;
      await api.registrarEstadoRemoto({ ...resto, ...referenciaTurno(idClienteTurno) });
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
  }
};

const procesarCola = async (idOperador: number): Promise<ResultadoEnvio> => {
  for (;;) {
    const operacion = await siguienteOperacion(idOperador);
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
          await marcarOperacionConError(operacion, `${error.code ?? error.status}: ${error.message}`);
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

  // Turnos que el teléfono cree abiertos pero el servidor ya cerró (12 h o jefe de turno).
  // Solo los ya sincronizados: uno que nunca llegó al servidor sigue siendo válido localmente.
  for (const local of enCursoLocales) {
    if (local.idCliente === idClienteVigente || !local.sincronizado) continue;
    const esElCerradoAuto =
      cerradoAuto && ((cerradoAuto.idCliente && cerradoAuto.idCliente === local.idCliente) || cerradoAuto.id === local.idServidor);
    await actualizarTurno(db, local.idCliente, {
      estado: esElCerradoAuto ? 'CERRADO_AUTO' : 'CERRADO',
      fechaFin: (esElCerradoAuto ? cerradoAuto.fechaFin : null) ?? new Date().toISOString(),
    });
    await db.runAsync('UPDATE turno_estado SET fin = ? WHERE id_cliente_turno = ? AND fin IS NULL', [new Date().toISOString(), local.idCliente]);
    cambios = true;
  }

  if (!turnoRemoto) {
    await guardarAjuste(
      AVISO_CIERRE_AUTO(idOperador),
      cerradoAuto ? { idCliente: cerradoAuto.idCliente, id: cerradoAuto.id, fechaInicio: cerradoAuto.fechaInicio, fechaFin: cerradoAuto.fechaFin } : null,
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
 */
export const sincronizarCatalogos = async (forzar = false) => {
  const versionGuardada = await leerAjuste<number>('catalogo_version');
  if (versionGuardada !== VERSION_CATALOGOS) forzar = true;
  let cambios = false;
  for (const catalogo of CATALOGOS) {
    const actualizado = await catalogoActualizadoEn(catalogo.tipo);
    if (!forzar && actualizado && Date.now() - actualizado.getTime() < CATALOGO_VIGENCIA_MS) continue;
    const items = await catalogo.cargar();
    await guardarCatalogo(catalogo.tipo, items, catalogo.padre as ((item: { id: number }) => number) | undefined);
    cambios = true;
  }
  if (versionGuardada !== VERSION_CATALOGOS) await guardarAjuste('catalogo_version', VERSION_CATALOGOS);
  if (cambios) emitirCambioDatos();
};

const actualizarContadores = async (idOperador: number) => {
  const { pendientes, errores } = await contarOperaciones(idOperador);
  actualizarEstadoSincronizacion({ pendientes, errores });
};

const ejecutar = async () => {
  const sesion = await leerSesion();
  const idOperador = sesion?.idOperador;
  if (!idOperador) return;

  actualizarEstadoSincronizacion({ sincronizando: true });
  try {
    const resultado = await procesarCola(idOperador);
    await actualizarContadores(idOperador);
    if (resultado !== 'ok') {
      if (resultado === 'reintentar') actualizarEstadoSincronizacion({ ultimoError: 'El servidor no respondió; se reintentará.' });
      return;
    }

    const { pendientes } = await contarOperaciones(idOperador);
    if (pendientes === 0) {
      await conciliarTurno(idOperador);
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

export const refrescarContadores = async () => {
  const sesion = await leerSesion();
  if (sesion?.idOperador) await actualizarContadores(sesion.idOperador);
};
