import * as Crypto from 'expo-crypto';
import { ahoraIso, getDb, guardarAjuste, leerAjuste } from '../db/database';
import { leerCatalogo } from '../db/catalogoLocal';
import {
  cerrarTurnoLocal,
  detallarTurno,
  eliminarEvidenciaLocal,
  insertarEstado,
  insertarEvidencia,
  insertarReporte,
  insertarTurno,
  limiteCierreAutomatico,
  listarEvidencias,
  listarTurnosEnCurso,
  obtenerTurno,
  EvidenciaLocal,
} from '../db/turnoLocal';
import { descartarOperacionesDeEntidad, encolar } from '../sync/colaSync';
import { emitirCambioDatos } from '../sync/eventos';
import { AVISO_CIERRE_AUTO, refrescarContadores, solicitarSincronizacion } from '../sync/syncEngine';
import { leerSesion } from './authStorage';
import { eliminarFotoLocal, guardarFotoLocal } from './fotos';
import { FOTOS_HABILITADAS } from '../constants/features';
import {
  EstadoOperacional,
  EstadoTurno,
  FinalizarTurnoDatos,
  FotoCapturada,
  IniciarTurnoDatos,
  TurnoActual,
  TurnoCerradoAutomaticamente,
} from '../types/turno';

/*
 * Acciones del operador, offline-first: cada una se guarda en SQLite y se encola para el Backend
 * en una sola transacción, y responde de inmediato. La sincronización corre en segundo plano.
 */

export class OperacionError extends Error {}

const nuevoId = () => Crypto.randomUUID();

const idOperadorActual = async (): Promise<number> => {
  const sesion = await leerSesion();
  if (!sesion?.idOperador) throw new OperacionError('No hay un operador con sesión iniciada.');
  return sesion.idOperador;
};

const despues = async () => {
  emitirCambioDatos();
  await refrescarContadores();
  solicitarSincronizacion();
};

/**
 * Prepara (fuera de la transacción) la copia persistente de una foto y devuelve lo necesario
 * para registrarla.
 */
const prepararFoto = async (foto: FotoCapturada | null) => {
  if (!foto || !FOTOS_HABILITADAS) return null;
  const idCliente = nuevoId();
  const uriLocal = await guardarFotoLocal(foto.uri, idCliente, foto.mimeType);
  return { idCliente, uriLocal, mimeType: foto.mimeType };
};

/**
 * Registra un reporte (INICIO, FIN o NOVEDAD) y su foto, si hay, dentro de una transacción.
 */
const registrarReporte = async (
  txn: Awaited<ReturnType<typeof getDb>>,
  datos: {
    idOperador: number;
    idClienteTurno: string;
    tipo: 'INICIO' | 'FIN' | 'NOVEDAD';
    descripcion: string | null;
    foto: Awaited<ReturnType<typeof prepararFoto>>;
    fechaHora: string;
  },
) => {
  const idReporte = nuevoId();
  await insertarReporte(txn, {
    idCliente: idReporte,
    idClienteTurno: datos.idClienteTurno,
    tipo: datos.tipo,
    descripcion: datos.descripcion,
    fechaHora: datos.fechaHora,
  });
  await encolar(txn, {
    tipo: 'CREAR_REPORTE',
    idEntidad: idReporte,
    idOperador: datos.idOperador,
    payload: {
      idCliente: idReporte,
      idClienteTurno: datos.idClienteTurno,
      tipo: datos.tipo,
      descripcion: datos.descripcion,
      fechaHora: datos.fechaHora,
    },
  });
  if (datos.foto) {
    await insertarEvidencia(txn, {
      idCliente: datos.foto.idCliente,
      idClienteReporte: idReporte,
      idOperador: datos.idOperador,
      uriLocal: datos.foto.uriLocal,
      mimeType: datos.foto.mimeType,
      fechaHora: datos.fechaHora,
    });
    await encolar(txn, {
      tipo: 'SUBIR_EVIDENCIA',
      idEntidad: datos.foto.idCliente,
      idOperador: datos.idOperador,
      payload: {
        idCliente: datos.foto.idCliente,
        idClienteReporte: idReporte,
        fechaHora: datos.fechaHora,
        uri: datos.foto.uriLocal,
        mimeType: datos.foto.mimeType,
      },
    });
  }
};

/**
 * Turno en curso del operador, leído del teléfono. Si pasó de 12 h se cierra automáticamente
 * (igual que lo hará el servidor al sincronizar).
 */
export const obtenerTurnoActual = async (): Promise<{
  turno: TurnoActual | null;
  turnoCerradoAutomaticamente: TurnoCerradoAutomaticamente | null;
}> => {
  const sesion = await leerSesion();
  const idOperador = sesion?.idOperador;
  if (!idOperador) return { turno: null, turnoCerradoAutomaticamente: null };

  const [vigente, ...anteriores] = await listarTurnosEnCurso(idOperador);
  const db = await getDb();
  // Solo debería haber uno; si quedaron otros (p. ej. por un conflicto), se tratan como olvidados
  for (const turno of anteriores) await cerrarTurnoLocal(db, turno, limiteCierreAutomatico(turno.fechaInicio), null);

  if (vigente && Date.now() > limiteCierreAutomatico(vigente.fechaInicio).getTime()) {
    await cerrarTurnoLocal(db, vigente, limiteCierreAutomatico(vigente.fechaInicio), null);
    const aviso: TurnoCerradoAutomaticamente = {
      idCliente: vigente.idCliente,
      id: vigente.idServidor,
      fechaInicio: vigente.fechaInicio,
      fechaFin: limiteCierreAutomatico(vigente.fechaInicio).toISOString(),
    };
    await guardarAjuste(AVISO_CIERRE_AUTO(idOperador), aviso);
    return { turno: null, turnoCerradoAutomaticamente: aviso };
  }

  return {
    turno: vigente ? await detallarTurno(vigente) : null,
    turnoCerradoAutomaticamente: vigente ? null : await leerAjuste<TurnoCerradoAutomaticamente>(AVISO_CIERRE_AUTO(idOperador)),
  };
};

export const iniciarTurno = async (datos: IniciarTurnoDatos): Promise<void> => {
  const idOperador = await idOperadorActual();
  if ((await listarTurnosEnCurso(idOperador)).length > 0) {
    throw new OperacionError('Ya tienes un turno en curso.');
  }
  if (!Number.isFinite(datos.horometroInicial) || datos.horometroInicial < 0) {
    throw new OperacionError('El horómetro inicial no es válido.');
  }

  const idCliente = nuevoId();
  const fechaInicio = ahoraIso();
  const instrucciones = datos.instrucciones.trim() || null;
  const foto = await prepararFoto(datos.foto);

  const db = await getDb();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await insertarTurno(txn, {
      idCliente,
      idServidor: null,
      idOperador,
      maquina: datos.maquina,
      area: datos.area,
      zona: datos.zona,
      fechaInicio,
      fechaFin: null,
      horometroInicial: datos.horometroInicial,
      horometroFinal: null,
      estado: 'EN_CURSO',
      sincronizado: false,
    });
    await encolar(txn, {
      tipo: 'INICIAR_TURNO',
      idEntidad: idCliente,
      idOperador,
      payload: {
        idCliente,
        fechaInicio,
        idMaquina: datos.maquina.id,
        horometroInicial: datos.horometroInicial,
        idArea: datos.area.id,
        idZona: datos.zona?.id ?? null,
      },
    });
    if (instrucciones || foto) {
      await registrarReporte(txn, { idOperador, idClienteTurno: idCliente, tipo: 'INICIO', descripcion: instrucciones, foto, fechaHora: fechaInicio });
    }
  });
  await guardarAjuste(AVISO_CIERRE_AUTO(idOperador), null);
  await despues();
};

export const finalizarTurno = async (idClienteTurno: string, datos: FinalizarTurnoDatos): Promise<EstadoTurno> => {
  const idOperador = await idOperadorActual();
  const turno = await obtenerTurno(idClienteTurno);
  if (!turno || turno.idOperador !== idOperador || turno.estado !== 'EN_CURSO') {
    throw new OperacionError('El turno ya no está en curso.');
  }
  if (!Number.isFinite(datos.horometroFinal) || datos.horometroFinal < turno.horometroInicial) {
    throw new OperacionError('El horómetro final debe ser mayor o igual al inicial.');
  }

  const fechaFin = new Date();
  const novedades = datos.novedades.trim() || null;
  const foto = await prepararFoto(datos.foto);

  const db = await getDb();
  let estadoFinal: EstadoTurno = 'CERRADO';
  await db.withExclusiveTransactionAsync(async (txn) => {
    estadoFinal = await cerrarTurnoLocal(txn, turno, fechaFin, datos.horometroFinal);
    await encolar(txn, {
      tipo: 'FINALIZAR_TURNO',
      idEntidad: idClienteTurno,
      idOperador,
      payload: { idClienteTurno, horometroFinal: datos.horometroFinal, fechaFin: fechaFin.toISOString() },
    });
    if (novedades || foto) {
      await registrarReporte(txn, { idOperador, idClienteTurno, tipo: 'FIN', descripcion: novedades, foto, fechaHora: fechaFin.toISOString() });
    }
  });
  await despues();
  return estadoFinal;
};

export const cambiarEstadoOperacional = async (idClienteTurno: string, estado: EstadoOperacional): Promise<void> => {
  const idOperador = await idOperadorActual();
  const turno = await obtenerTurno(idClienteTurno);
  if (!turno || turno.estado !== 'EN_CURSO') throw new OperacionError('El turno ya no está en curso.');

  const idCliente = nuevoId();
  const inicio = ahoraIso();
  const db = await getDb();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await insertarEstado(txn, { idCliente, idClienteTurno, estado, inicio });
    await encolar(txn, {
      tipo: 'REGISTRAR_ESTADO',
      idEntidad: idCliente,
      idOperador,
      payload: { idCliente, idClienteTurno, idEstado: estado.id, inicio },
    });
  });
  await despues();
};

/**
 * Novedad durante el turno (p. ej. foto de una falla) desde la pantalla de evidencias.
 */
export const registrarNovedad = async (descripcion: string, foto: FotoCapturada): Promise<void> => {
  if (!FOTOS_HABILITADAS) throw new OperacionError('Las fotos de evidencia están desactivadas por ahora.');
  const idOperador = await idOperadorActual();
  const [turno] = await listarTurnosEnCurso(idOperador);
  if (!turno) throw new OperacionError('Debes tener un turno en curso para registrar evidencias.');

  const fotoLocal = await prepararFoto(foto);
  const db = await getDb();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await registrarReporte(txn, {
      idOperador,
      idClienteTurno: turno.idCliente,
      tipo: 'NOVEDAD',
      descripcion: descripcion.trim() || null,
      foto: fotoLocal,
      fechaHora: ahoraIso(),
    });
  });
  await despues();
};

export const listarEvidenciasLocales = async (): Promise<EvidenciaLocal[]> => {
  const sesion = await leerSesion();
  return sesion?.idOperador ? listarEvidencias(sesion.idOperador) : [];
};

/**
 * Elimina una foto que aún no se sube. Una ya sincronizada no se puede eliminar desde el teléfono.
 */
export const eliminarEvidenciaPendiente = async (evidencia: EvidenciaLocal): Promise<void> => {
  if (evidencia.estadoSync === 'SINCRONIZADO') {
    throw new OperacionError('La evidencia ya está en el servidor y no puede eliminarse.');
  }
  const db = await getDb();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await descartarOperacionesDeEntidad(txn, evidencia.idCliente);
    await eliminarEvidenciaLocal(txn, evidencia.idCliente);
  });
  eliminarFotoLocal(evidencia.uriLocal);
  await despues();
};

export const catalogoEstados = () => leerCatalogo<EstadoOperacional>('estado');
