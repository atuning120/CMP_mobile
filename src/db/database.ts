import * as SQLite from 'expo-sqlite';

/*
 * Base de datos local (SQLite) de la app. Es la fuente de verdad mientras se trabaja: la UI lee y
 * escribe aquí, y el motor de sincronización (src/sync) replica los cambios al Backend en segundo
 * plano mediante la tabla operacion_pendiente.
 *
 * Fechas en ISO 8601 (TEXT), booleanos 0/1 y objetos de catálogo como JSON (TEXT).
 */

// Cada entrada es una versión; nunca modificar una ya publicada, solo agregar nuevas al final.
const MIGRACIONES: string[] = [
  `
  CREATE TABLE IF NOT EXISTS catalogo (
    tipo      TEXT NOT NULL,     -- maquina | area | zona | estado
    id        INTEGER NOT NULL,
    id_padre  INTEGER,           -- id_area de una zona
    datos     TEXT NOT NULL,     -- JSON con el objeto ya mapeado para la app
    PRIMARY KEY (tipo, id)
  );

  CREATE TABLE IF NOT EXISTS ajuste (
    clave TEXT PRIMARY KEY NOT NULL,
    valor TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS turno (
    id_cliente        TEXT PRIMARY KEY NOT NULL,  -- UUID generado al iniciar (o "srv-<id>" si vino del servidor)
    id_servidor       INTEGER,
    id_operador       INTEGER NOT NULL,
    maquina           TEXT NOT NULL,              -- JSON Maquina
    area              TEXT,                       -- JSON Area
    zona              TEXT,                       -- JSON ZonaTrabajo
    fecha_inicio      TEXT NOT NULL,
    fecha_fin         TEXT,
    horometro_inicial REAL NOT NULL,
    horometro_final   REAL,
    estado            TEXT NOT NULL,              -- EN_CURSO | CERRADO | CERRADO_AUTO
    sincronizado      INTEGER NOT NULL DEFAULT 0, -- 1 cuando el servidor confirmó el inicio
    conflicto         INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_turno_operador ON turno (id_operador, estado);

  CREATE TABLE IF NOT EXISTS turno_estado (
    id_cliente        TEXT PRIMARY KEY NOT NULL,
    id_cliente_turno  TEXT NOT NULL,
    estado            TEXT NOT NULL,              -- JSON EstadoOperacional
    inicio            TEXT NOT NULL,
    fin               TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_turno_estado_turno ON turno_estado (id_cliente_turno, inicio);

  CREATE TABLE IF NOT EXISTS reporte (
    id_cliente        TEXT PRIMARY KEY NOT NULL,
    id_cliente_turno  TEXT NOT NULL,
    tipo              TEXT NOT NULL,              -- INICIO | FIN | NOVEDAD
    descripcion       TEXT,
    fecha_hora        TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS evidencia (
    id_cliente         TEXT PRIMARY KEY NOT NULL,
    id_cliente_reporte TEXT NOT NULL,
    id_operador        INTEGER NOT NULL,
    uri_local          TEXT NOT NULL,             -- copia persistente de la foto en el dispositivo
    mime_type          TEXT NOT NULL,
    fecha_hora         TEXT NOT NULL,
    estado_sync        TEXT NOT NULL DEFAULT 'PENDIENTE'  -- PENDIENTE | SINCRONIZADO | ERROR_SINCRONIZACION
  );

  -- Cola de operaciones a replicar en el Backend (patrón outbox). Se procesa en orden de id.
  CREATE TABLE IF NOT EXISTS operacion_pendiente (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo            TEXT NOT NULL,
    id_entidad      TEXT NOT NULL,                -- id_cliente de la entidad afectada
    id_operador     INTEGER NOT NULL,             -- solo se envía con la sesión de este operador
    payload         TEXT NOT NULL,                -- JSON
    estado          TEXT NOT NULL DEFAULT 'PENDIENTE',  -- PENDIENTE | ERROR
    intentos        INTEGER NOT NULL DEFAULT 0,
    ultimo_error    TEXT,
    proximo_intento TEXT NOT NULL,
    creado_en       TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_operacion_operador ON operacion_pendiente (id_operador, estado, id);
  `,
];

export type Db = SQLite.SQLiteDatabase;

let dbPromise: Promise<Db> | null = null;

const migrar = async (db: Db) => {
  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const actual = fila?.user_version ?? 0;
  for (let version = actual; version < MIGRACIONES.length; version++) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(MIGRACIONES[version]);
      await txn.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
};

const abrir = async (): Promise<Db> => {
  const db = await SQLite.openDatabaseAsync('cmp.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await migrar(db);
  return db;
};

export const getDb = (): Promise<Db> => {
  if (!dbPromise) {
    dbPromise = abrir().catch((error) => {
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
};

export const leerAjuste = async <T>(clave: string): Promise<T | null> => {
  const db = await getDb();
  const fila = await db.getFirstAsync<{ valor: string }>('SELECT valor FROM ajuste WHERE clave = ?', [clave]);
  return fila ? (JSON.parse(fila.valor) as T) : null;
};

export const guardarAjuste = async (clave: string, valor: unknown) => {
  const db = await getDb();
  if (valor === null || valor === undefined) {
    await db.runAsync('DELETE FROM ajuste WHERE clave = ?', [clave]);
    return;
  }
  await db.runAsync('INSERT OR REPLACE INTO ajuste (clave, valor) VALUES (?, ?)', [clave, JSON.stringify(valor)]);
};

export const ahoraIso = () => new Date().toISOString();
