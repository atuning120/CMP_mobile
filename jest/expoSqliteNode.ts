/*
 * expo-sqlite para los tests (Jest corre en Node, sin el módulo nativo): la misma API async que usa la app,
 * sobre node:sqlite (incluido en Node 22.13+). Así los tests ejecutan el SQL y las migraciones reales de
 * src/db/database.ts, no un mock. Cada openDatabaseAsync abre una base nueva en memoria.
 *
 * Solo implementa lo que usa la app; si src/db empieza a usar otro método de expo-sqlite, agregarlo aquí.
 */

type Valor = string | number | null;
type Fila = Record<string, unknown>;

interface Sentencia {
  run(...parametros: Valor[]): { changes: number | bigint; lastInsertRowid: number | bigint };
  get(...parametros: Valor[]): Fila | undefined;
  all(...parametros: Valor[]): Fila[];
}

interface DatabaseSync {
  exec(sql: string): void;
  prepare(sql: string): Sentencia;
}

// process.getBuiltinModule evita el resolver de Jest, que no conoce los módulos que solo existen con prefijo node:
const { DatabaseSync } = (
  globalThis as unknown as { process: { getBuiltinModule(id: string): { DatabaseSync: new (ruta: string) => DatabaseSync } } }
).process.getBuiltinModule('node:sqlite');

// Igual que expo-sqlite: booleanos como 0/1 y undefined como NULL
const normalizar = (parametros: unknown[] = []): Valor[] =>
  parametros.map((p) => (typeof p === 'boolean' ? Number(p) : p === undefined ? null : (p as Valor)));

// Filas como objetos planos (node:sqlite las entrega sin prototipo)
const plana = <T>(fila: Fila): T => ({ ...fila }) as T;

class BaseDeDatosNode {
  private readonly db: DatabaseSync;

  constructor() {
    this.db = new DatabaseSync(':memory:');
  }

  async execAsync(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async runAsync(sql: string, parametros?: unknown[]): Promise<{ changes: number; lastInsertRowId: number }> {
    const r = this.db.prepare(sql).run(...normalizar(parametros));
    return { changes: Number(r.changes), lastInsertRowId: Number(r.lastInsertRowid) };
  }

  async getFirstAsync<T>(sql: string, parametros?: unknown[]): Promise<T | null> {
    const fila = this.db.prepare(sql).get(...normalizar(parametros));
    return fila ? plana<T>(fila) : null;
  }

  async getAllAsync<T>(sql: string, parametros?: unknown[]): Promise<T[]> {
    return this.db
      .prepare(sql)
      .all(...normalizar(parametros))
      .map((fila) => plana<T>(fila));
  }

  // Transacciones en fila: como en el teléfono, una segunda espera a que termine la primera (p. ej. una acción del
  // operador mientras el motor de sincronización concilia). En el teléfono usan otra conexión; aquí basta la misma
  private transacciones: Promise<void> = Promise.resolve();

  withExclusiveTransactionAsync(tarea: (txn: BaseDeDatosNode) => Promise<void>): Promise<void> {
    const ejecucion = this.transacciones.then(async () => {
      this.db.exec('BEGIN EXCLUSIVE');
      try {
        await tarea(this);
        this.db.exec('COMMIT');
      } catch (error) {
        this.db.exec('ROLLBACK');
        throw error;
      }
    });
    this.transacciones = ejecucion.catch(() => undefined);
    return ejecucion;
  }
}

export const openDatabaseAsync = async (_nombre: string) => new BaseDeDatosNode();

export type SQLiteDatabase = BaseDeDatosNode;
