import { Db, getDb } from '../db/database';
import type { SesionGuardada } from '../services/authStorage';

/*
 * Cola de operaciones pendientes de enviar al Backend (patrón outbox). Cada acción del operador
 * se guarda en SQLite junto con su operación, en la misma transacción: si la app se cierra o no
 * hay red, nada se pierde y el motor de sincronización la enviará después, en orden.
 *
 * El jefe de turno usa la misma cola para lo que hace sin señal (p. ej. atender una alerta): sus
 * operaciones no tienen operador y se identifican por el usuario de la sesión.
 */

export type TipoOperacion =
  | 'INICIAR_TURNO'
  | 'FINALIZAR_TURNO'
  | 'REGISTRAR_ESTADO'
  | 'CAMBIAR_UBICACION'
  | 'CREAR_REPORTE'
  | 'SUBIR_EVIDENCIA'
  | 'ATENDER_ALERTA';

// De quién es la cola: solo se envía con su sesión
export type DuenoCola = { idOperador: number } | { usuario: string };

export const duenoDeSesion = (sesion: SesionGuardada | null): DuenoCola | null => {
  if (!sesion) return null;
  if (sesion.rol === 'JEFE_TURNO') return { usuario: sesion.identificador };
  return sesion.idOperador ? { idOperador: sesion.idOperador } : null;
};

// Condición SQL y su parámetro para filtrar las operaciones del dueño
const filtroDueno = (dueno: DuenoCola): [string, string | number] =>
  'usuario' in dueno ? ['usuario = ?', dueno.usuario] : ['id_operador = ?', dueno.idOperador];

export interface OperacionPendiente {
  id: number;
  tipo: TipoOperacion;
  idEntidad: string;
  idOperador: number;
  usuario: string | null;
  claveBloqueo: string | null;
  fechaAccion: string | null;
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
  usuario: string | null;
  clave_bloqueo: string | null;
  fecha_accion: string | null;
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
  usuario: fila.usuario,
  claveBloqueo: fila.clave_bloqueo,
  fechaAccion: fila.fecha_accion,
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

// Acción del jefe de turno: claveBloqueo agrupa las que deben llegar en orden (las de una misma alerta o máquina)
export const encolarAccionJefe = async (
  ejecutor: Db,
  operacion: {
    tipo: TipoOperacion;
    idEntidad: string;
    usuario: string;
    claveBloqueo: string;
    fechaAccion: string;
    payload: Record<string, unknown>;
  },
) => {
  const ahora = new Date().toISOString();
  await ejecutor.runAsync(
    `INSERT INTO operacion_pendiente (tipo, id_entidad, id_operador, usuario, clave_bloqueo, fecha_accion, payload, proximo_intento, creado_en)
     VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?)`,
    [
      operacion.tipo,
      operacion.idEntidad,
      operacion.usuario,
      operacion.claveBloqueo,
      operacion.fechaAccion,
      JSON.stringify(operacion.payload),
      ahora,
      ahora,
    ],
  );
};

// Próxima operación lista para enviar (respetando el orden de registro y el backoff). Una con clave de bloqueo espera
// a que se envíen o descarten las anteriores con la misma clave, aunque estén con error
export const siguienteOperacion = async (dueno: DuenoCola): Promise<OperacionPendiente | null> => {
  const [condicion, valor] = filtroDueno(dueno);
  const db = await getDb();
  const fila = await db.getFirstAsync<OperacionFila>(
    `SELECT * FROM operacion_pendiente o
      WHERE o.${condicion} AND o.estado = 'PENDIENTE' AND o.proximo_intento <= ?
        AND NOT EXISTS (
          SELECT 1 FROM operacion_pendiente a
           WHERE a.clave_bloqueo = o.clave_bloqueo AND a.usuario IS o.usuario AND a.id_operador = o.id_operador AND a.id < o.id
        )
      ORDER BY o.id LIMIT 1`,
    [valor, new Date().toISOString()],
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

// Error permanente (el servidor rechazó los datos): queda para revisión, no bloquea la cola (solo a las de su misma clave)
export const marcarOperacionConError = async (operacion: OperacionPendiente, error: string) => {
  const db = await getDb();
  await db.runAsync("UPDATE operacion_pendiente SET estado = 'ERROR', intentos = ?, ultimo_error = ? WHERE id = ?", [
    operacion.intentos + 1,
    error,
    operacion.id,
  ]);
};

export const reintentarOperacionesConError = async (dueno: DuenoCola) => {
  const [condicion, valor] = filtroDueno(dueno);
  const db = await getDb();
  await db.runAsync(`UPDATE operacion_pendiente SET estado = 'PENDIENTE', proximo_intento = ? WHERE ${condicion} AND estado = 'ERROR'`, [
    new Date().toISOString(),
    valor,
  ]);
};

// Ignora el backoff: al recuperar la red conviene reintentar de inmediato
export const adelantarReintentos = async (dueno: DuenoCola) => {
  const [condicion, valor] = filtroDueno(dueno);
  const db = await getDb();
  await db.runAsync(`UPDATE operacion_pendiente SET proximo_intento = ? WHERE ${condicion} AND estado = 'PENDIENTE'`, [
    new Date().toISOString(),
    valor,
  ]);
};

export const contarOperaciones = async (dueno: DuenoCola): Promise<{ pendientes: number; errores: number }> => {
  const [condicion, valor] = filtroDueno(dueno);
  const db = await getDb();
  const fila = await db.getFirstAsync<{ pendientes: number; errores: number }>(
    `SELECT COALESCE(SUM(estado = 'PENDIENTE'), 0) AS pendientes, COALESCE(SUM(estado = 'ERROR'), 0) AS errores
       FROM operacion_pendiente WHERE ${condicion}`,
    [valor],
  );
  return { pendientes: fila?.pendientes ?? 0, errores: fila?.errores ?? 0 };
};

export const listarOperacionesConError = async (dueno: DuenoCola): Promise<OperacionPendiente[]> => {
  const [condicion, valor] = filtroDueno(dueno);
  const db = await getDb();
  const filas = await db.getAllAsync<OperacionFila>(
    `SELECT * FROM operacion_pendiente WHERE ${condicion} AND estado = 'ERROR' ORDER BY id`,
    [valor],
  );
  return filas.map(mapOperacion);
};

// Operaciones de un tipo aún no enviadas (pendientes o con error), en orden
export const listarOperaciones = async (dueno: DuenoCola, tipo: TipoOperacion): Promise<OperacionPendiente[]> => {
  const [condicion, valor] = filtroDueno(dueno);
  const db = await getDb();
  const filas = await db.getAllAsync<OperacionFila>(`SELECT * FROM operacion_pendiente WHERE ${condicion} AND tipo = ? ORDER BY id`, [
    valor,
    tipo,
  ]);
  return filas.map(mapOperacion);
};

export const hayOperacionesConClave = async (dueno: DuenoCola, claveBloqueo: string): Promise<boolean> => {
  const [condicion, valor] = filtroDueno(dueno);
  const db = await getDb();
  const fila = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM operacion_pendiente WHERE ${condicion} AND clave_bloqueo = ?`,
    [valor, claveBloqueo],
  );
  return (fila?.n ?? 0) > 0;
};

// Quita una operación aún no enviada (p. ej. el operador elimina una foto antes de sincronizarla)
export const descartarOperacionesDeEntidad = async (ejecutor: Db, idEntidad: string): Promise<number> => {
  const resultado = await ejecutor.runAsync('DELETE FROM operacion_pendiente WHERE id_entidad = ?', [idEntidad]);
  return resultado.changes;
};
