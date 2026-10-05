import { Db, getDb } from '../db/database';

/*
 * Cola de operaciones pendientes de enviar al Backend (patrón outbox). Cada acción del operador
 * se guarda en SQLite junto con su operación, en la misma transacción: si la app se cierra o no
 * hay red, nada se pierde y el motor de sincronización la enviará después, en orden.
 */

export type TipoOperacion = 'INICIAR_TURNO' | 'FINALIZAR_TURNO' | 'REGISTRAR_ESTADO' | 'CREAR_REPORTE' | 'SUBIR_EVIDENCIA';

export interface OperacionPendiente {
  id: number;
  tipo: TipoOperacion;
  idEntidad: string;
  idOperador: number;
  payload: Record<string, unknown>;
  estado: 'PENDIENTE' | 'ERROR';
  intentos: number;
  ultimoError: string | null;
}

interface OperacionFila {
  id: number;
  tipo: TipoOperacion;
  id_entidad: string;
  id_operador: number;
  payload: string;
  estado: 'PENDIENTE' | 'ERROR';
  intentos: number;
  ultimo_error: string | null;
}

const mapOperacion = (fila: OperacionFila): OperacionPendiente => ({
  id: fila.id,
  tipo: fila.tipo,
  idEntidad: fila.id_entidad,
  idOperador: fila.id_operador,
  payload: JSON.parse(fila.payload) as Record<string, unknown>,
  estado: fila.estado,
  intentos: fila.intentos,
  ultimoError: fila.ultimo_error,
});

export const encolar = async (
  ejecutor: Db,
  operacion: { tipo: TipoOperacion; idEntidad: string; idOperador: number; payload: Record<string, unknown> },
) => {
  const ahora = new Date().toISOString();
  await ejecutor.runAsync(
    `INSERT INTO operacion_pendiente (tipo, id_entidad, id_operador, payload, proximo_intento, creado_en)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [operacion.tipo, operacion.idEntidad, operacion.idOperador, JSON.stringify(operacion.payload), ahora, ahora],
  );
};

// Próxima operación lista para enviar (respetando el orden de registro y el backoff)
export const siguienteOperacion = async (idOperador: number): Promise<OperacionPendiente | null> => {
  const db = await getDb();
  const fila = await db.getFirstAsync<OperacionFila>(
    `SELECT * FROM operacion_pendiente
      WHERE id_operador = ? AND estado = 'PENDIENTE' AND proximo_intento <= ?
      ORDER BY id LIMIT 1`,
    [idOperador, new Date().toISOString()],
  );
  return fila ? mapOperacion(fila) : null;
};

export const completarOperacion = async (id: number) => {
  const db = await getDb();
  await db.runAsync('DELETE FROM operacion_pendiente WHERE id = ?', [id]);
};

// Error transitorio (servidor caído, timeout): se reintenta con espera exponencial
export const reprogramarOperacion = async (operacion: OperacionPendiente, error: string) => {
  const intentos = operacion.intentos + 1;
  const esperaMs = Math.min(15_000 * 2 ** (intentos - 1), 15 * 60_000);
  const db = await getDb();
  await db.runAsync('UPDATE operacion_pendiente SET intentos = ?, ultimo_error = ?, proximo_intento = ? WHERE id = ?', [
    intentos,
    error,
    new Date(Date.now() + esperaMs).toISOString(),
    operacion.id,
  ]);
};

// Error permanente (el servidor rechazó los datos): queda para revisión, no bloquea la cola
export const marcarOperacionConError = async (operacion: OperacionPendiente, error: string) => {
  const db = await getDb();
  await db.runAsync("UPDATE operacion_pendiente SET estado = 'ERROR', intentos = ?, ultimo_error = ? WHERE id = ?", [
    operacion.intentos + 1,
    error,
    operacion.id,
  ]);
};

export const reintentarOperacionesConError = async (idOperador: number) => {
  const db = await getDb();
  await db.runAsync(
    "UPDATE operacion_pendiente SET estado = 'PENDIENTE', proximo_intento = ? WHERE id_operador = ? AND estado = 'ERROR'",
    [new Date().toISOString(), idOperador],
  );
};

// Ignora el backoff: al recuperar la red conviene reintentar de inmediato
export const adelantarReintentos = async (idOperador: number) => {
  const db = await getDb();
  await db.runAsync("UPDATE operacion_pendiente SET proximo_intento = ? WHERE id_operador = ? AND estado = 'PENDIENTE'", [
    new Date().toISOString(),
    idOperador,
  ]);
};

export const contarOperaciones = async (idOperador: number): Promise<{ pendientes: number; errores: number }> => {
  const db = await getDb();
  const fila = await db.getFirstAsync<{ pendientes: number; errores: number }>(
    `SELECT COALESCE(SUM(estado = 'PENDIENTE'), 0) AS pendientes, COALESCE(SUM(estado = 'ERROR'), 0) AS errores
       FROM operacion_pendiente WHERE id_operador = ?`,
    [idOperador],
  );
  return { pendientes: fila?.pendientes ?? 0, errores: fila?.errores ?? 0 };
};

export const listarOperacionesConError = async (idOperador: number): Promise<OperacionPendiente[]> => {
  const db = await getDb();
  const filas = await db.getAllAsync<OperacionFila>(
    "SELECT * FROM operacion_pendiente WHERE id_operador = ? AND estado = 'ERROR' ORDER BY id",
    [idOperador],
  );
  return filas.map(mapOperacion);
};

// Quita una operación aún no enviada (p. ej. el operador elimina una foto antes de sincronizarla)
export const descartarOperacionesDeEntidad = async (ejecutor: Db, idEntidad: string): Promise<number> => {
  const resultado = await ejecutor.runAsync('DELETE FROM operacion_pendiente WHERE id_entidad = ?', [idEntidad]);
  return resultado.changes;
};
