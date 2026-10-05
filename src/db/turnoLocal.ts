import { Db, getDb } from './database';
import { Area, EstadoOperacional, EstadoTurno, Maquina, TurnoActual, ZonaTrabajo } from '../types/turno';

/*
 * Acceso a los datos del turno guardados en el teléfono. Las funciones que escriben reciben el
 * ejecutor (la base o una transacción) para poder combinarse con el encolado de operaciones
 * en una misma transacción.
 */

export const DURACION_MAXIMA_TURNO_MS = 12 * 60 * 60 * 1000;

interface TurnoFila {
  id_cliente: string;
  id_servidor: number | null;
  id_operador: number;
  maquina: string;
  area: string | null;
  zona: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  horometro_inicial: number;
  horometro_final: number | null;
  estado: EstadoTurno;
  sincronizado: number;
  conflicto: number;
}

export interface TurnoLocal {
  idCliente: string;
  idServidor: number | null;
  idOperador: number;
  maquina: Maquina;
  area: Area | null;
  zona: ZonaTrabajo | null;
  fechaInicio: string;
  fechaFin: string | null;
  horometroInicial: number;
  horometroFinal: number | null;
  estado: EstadoTurno;
  sincronizado: boolean;
}

export interface EvidenciaLocal {
  idCliente: string;
  idClienteReporte: string;
  uriLocal: string;
  mimeType: string;
  fechaHora: string;
  estadoSync: 'PENDIENTE' | 'SINCRONIZADO' | 'ERROR_SINCRONIZACION';
  descripcion: string | null;
  tipoReporte: string;
  area: string | null;
}

const mapTurno = (fila: TurnoFila): TurnoLocal => ({
  idCliente: fila.id_cliente,
  idServidor: fila.id_servidor,
  idOperador: fila.id_operador,
  maquina: JSON.parse(fila.maquina) as Maquina,
  area: fila.area ? (JSON.parse(fila.area) as Area) : null,
  zona: fila.zona ? (JSON.parse(fila.zona) as ZonaTrabajo) : null,
  fechaInicio: fila.fecha_inicio,
  fechaFin: fila.fecha_fin,
  horometroInicial: fila.horometro_inicial,
  horometroFinal: fila.horometro_final,
  estado: fila.estado,
  sincronizado: fila.sincronizado === 1,
});

export const limiteCierreAutomatico = (fechaInicio: string) => new Date(new Date(fechaInicio).getTime() + DURACION_MAXIMA_TURNO_MS);

export const insertarTurno = async (ejecutor: Db, turno: TurnoLocal) => {
  await ejecutor.runAsync(
    `INSERT INTO turno (id_cliente, id_servidor, id_operador, maquina, area, zona, fecha_inicio, fecha_fin,
       horometro_inicial, horometro_final, estado, sincronizado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      turno.idCliente,
      turno.idServidor,
      turno.idOperador,
      JSON.stringify(turno.maquina),
      turno.area ? JSON.stringify(turno.area) : null,
      turno.zona ? JSON.stringify(turno.zona) : null,
      turno.fechaInicio,
      turno.fechaFin,
      turno.horometroInicial,
      turno.horometroFinal,
      turno.estado,
      turno.sincronizado ? 1 : 0,
    ],
  );
};

export const actualizarTurno = async (
  ejecutor: Db,
  idCliente: string,
  cambios: Partial<Pick<TurnoLocal, 'idServidor' | 'fechaFin' | 'horometroFinal' | 'estado' | 'sincronizado'>> & { conflicto?: boolean },
) => {
  const columnas: Record<string, string> = {
    idServidor: 'id_servidor',
    fechaFin: 'fecha_fin',
    horometroFinal: 'horometro_final',
    estado: 'estado',
    sincronizado: 'sincronizado',
    conflicto: 'conflicto',
  };
  const entradas = Object.entries(cambios).filter(([, valor]) => valor !== undefined);
  if (entradas.length === 0) return;
  const sets = entradas.map(([campo]) => `${columnas[campo]} = ?`).join(', ');
  const valores = entradas.map(([, valor]) => (typeof valor === 'boolean' ? (valor ? 1 : 0) : (valor as string | number | null)));
  await ejecutor.runAsync(`UPDATE turno SET ${sets} WHERE id_cliente = ?`, [...valores, idCliente]);
};

export const obtenerTurno = async (idCliente: string): Promise<TurnoLocal | null> => {
  const db = await getDb();
  const fila = await db.getFirstAsync<TurnoFila>('SELECT * FROM turno WHERE id_cliente = ?', [idCliente]);
  return fila ? mapTurno(fila) : null;
};

export const obtenerTurnoPorServidor = async (idServidor: number): Promise<TurnoLocal | null> => {
  const db = await getDb();
  const fila = await db.getFirstAsync<TurnoFila>('SELECT * FROM turno WHERE id_servidor = ?', [idServidor]);
  return fila ? mapTurno(fila) : null;
};

export const listarTurnosEnCurso = async (idOperador: number): Promise<TurnoLocal[]> => {
  const db = await getDb();
  const filas = await db.getAllAsync<TurnoFila>(
    "SELECT * FROM turno WHERE id_operador = ? AND estado = 'EN_CURSO' ORDER BY fecha_inicio DESC",
    [idOperador],
  );
  return filas.map(mapTurno);
};

/**
 * Cierra un turno en el teléfono. Aplica la misma regla que el servidor: si el cierre ocurre
 * después de 12 h, queda CERRADO_AUTO en el límite.
 */
export const cerrarTurnoLocal = async (
  ejecutor: Db,
  turno: TurnoLocal,
  fecha: Date,
  horometroFinal: number | null,
): Promise<EstadoTurno> => {
  const limite = limiteCierreAutomatico(turno.fechaInicio);
  const automatico = fecha.getTime() > limite.getTime();
  const fechaFin = (automatico ? limite : fecha).toISOString();
  const estado: EstadoTurno = automatico ? 'CERRADO_AUTO' : 'CERRADO';
  await actualizarTurno(ejecutor, turno.idCliente, { fechaFin, horometroFinal, estado });
  await ejecutor.runAsync('UPDATE turno_estado SET fin = ? WHERE id_cliente_turno = ? AND fin IS NULL', [fechaFin, turno.idCliente]);
  return estado;
};

export const insertarEstado = async (
  ejecutor: Db,
  data: { idCliente: string; idClienteTurno: string; estado: EstadoOperacional; inicio: string; fin?: string | null },
) => {
  await ejecutor.runAsync('UPDATE turno_estado SET fin = ? WHERE id_cliente_turno = ? AND fin IS NULL AND inicio <= ?', [
    data.inicio,
    data.idClienteTurno,
    data.inicio,
  ]);
  await ejecutor.runAsync('INSERT OR IGNORE INTO turno_estado (id_cliente, id_cliente_turno, estado, inicio, fin) VALUES (?, ?, ?, ?, ?)', [
    data.idCliente,
    data.idClienteTurno,
    JSON.stringify(data.estado),
    data.inicio,
    data.fin ?? null,
  ]);
};

export const insertarReporte = async (
  ejecutor: Db,
  data: { idCliente: string; idClienteTurno: string; tipo: 'INICIO' | 'FIN' | 'NOVEDAD'; descripcion: string | null; fechaHora: string },
) => {
  await ejecutor.runAsync('INSERT INTO reporte (id_cliente, id_cliente_turno, tipo, descripcion, fecha_hora) VALUES (?, ?, ?, ?, ?)', [
    data.idCliente,
    data.idClienteTurno,
    data.tipo,
    data.descripcion,
    data.fechaHora,
  ]);
};

export const insertarEvidencia = async (
  ejecutor: Db,
  data: { idCliente: string; idClienteReporte: string; idOperador: number; uriLocal: string; mimeType: string; fechaHora: string },
) => {
  await ejecutor.runAsync(
    'INSERT INTO evidencia (id_cliente, id_cliente_reporte, id_operador, uri_local, mime_type, fecha_hora) VALUES (?, ?, ?, ?, ?, ?)',
    [data.idCliente, data.idClienteReporte, data.idOperador, data.uriLocal, data.mimeType, data.fechaHora],
  );
};

export const actualizarEstadoEvidencia = async (idCliente: string, estado: EvidenciaLocal['estadoSync']) => {
  const db = await getDb();
  await db.runAsync('UPDATE evidencia SET estado_sync = ? WHERE id_cliente = ?', [estado, idCliente]);
};

export const listarEvidencias = async (idOperador: number): Promise<EvidenciaLocal[]> => {
  const db = await getDb();
  const filas = await db.getAllAsync<{
    id_cliente: string;
    id_cliente_reporte: string;
    uri_local: string;
    mime_type: string;
    fecha_hora: string;
    estado_sync: EvidenciaLocal['estadoSync'];
    descripcion: string | null;
    tipo: string;
    area: string | null;
  }>(
    `SELECT e.*, r.descripcion, r.tipo, t.area
       FROM evidencia e
       JOIN reporte r ON r.id_cliente = e.id_cliente_reporte
       JOIN turno t ON t.id_cliente = r.id_cliente_turno
      WHERE e.id_operador = ?
      ORDER BY e.fecha_hora DESC`,
    [idOperador],
  );
  return filas.map((fila) => ({
    idCliente: fila.id_cliente,
    idClienteReporte: fila.id_cliente_reporte,
    uriLocal: fila.uri_local,
    mimeType: fila.mime_type,
    fechaHora: fila.fecha_hora,
    estadoSync: fila.estado_sync,
    descripcion: fila.descripcion,
    tipoReporte: fila.tipo,
    area: fila.area ? (JSON.parse(fila.area) as Area).nombre : null,
  }));
};

export const eliminarEvidenciaLocal = async (ejecutor: Db, idCliente: string) => {
  await ejecutor.runAsync('DELETE FROM evidencia WHERE id_cliente = ?', [idCliente]);
};

/**
 * Turno con su historial de estados y evidencias, en el formato que usa la UI.
 */
export const detallarTurno = async (turno: TurnoLocal): Promise<TurnoActual> => {
  const db = await getDb();
  const estados = await db.getAllAsync<{ id_cliente: string; estado: string; inicio: string; fin: string | null }>(
    'SELECT id_cliente, estado, inicio, fin FROM turno_estado WHERE id_cliente_turno = ? ORDER BY inicio',
    [turno.idCliente],
  );
  const evidencias = await db.getFirstAsync<{ cantidad: number }>(
    `SELECT COUNT(*) AS cantidad FROM evidencia e JOIN reporte r ON r.id_cliente = e.id_cliente_reporte
      WHERE r.id_cliente_turno = ?`,
    [turno.idCliente],
  );
  const historialEstados = estados.map((fila) => ({
    estado: JSON.parse(fila.estado) as EstadoOperacional,
    inicio: fila.inicio,
    fin: fila.fin,
  }));
  const vigente = estados.find((fila) => fila.fin === null);
  return {
    idCliente: turno.idCliente,
    id: turno.idServidor,
    maquina: turno.maquina,
    area: turno.area,
    zona: turno.zona,
    horometroInicial: turno.horometroInicial,
    estado: turno.estado,
    estadoOperacionalActual: vigente
      ? { id: vigente.id_cliente, estado: JSON.parse(vigente.estado) as EstadoOperacional, inicio: vigente.inicio }
      : null,
    historialEstados,
    cantidadEvidencias: evidencias?.cantidad ?? 0,
    fechaInicio: turno.fechaInicio,
    sincronizado: turno.sincronizado,
  };
};
