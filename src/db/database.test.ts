import { getDb, guardarAjuste, leerAjuste } from './database';

/*
 * Las migraciones corren en cada teléfono al abrir la app: un error aquí deja la app sin base local. Se prueban sobre
 * SQLite real (node:sqlite vía jest/expoSqliteNode.ts) partiendo de una base vacía, como en una instalación nueva.
 */

const columnas = async (tabla: string) => {
  const db = await getDb();
  const filas = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tabla})`);
  return filas.map((f) => f.name);
};

describe('database', () => {
  it('aplica todas las migraciones en una instalación nueva', async () => {
    const db = await getDb();
    const tablas = (await db.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'")).map((t) => t.name);

    expect(tablas).toEqual(
      expect.arrayContaining([
        'catalogo',
        'ajuste',
        'turno',
        'turno_estado',
        'reporte',
        'evidencia',
        'operacion_pendiente',
        'posicion_pendiente',
        'consulta_guardada',
        'registro_accion',
      ]),
    );
    expect(await columnas('operacion_pendiente')).toEqual(
      expect.arrayContaining(['usuario', 'clave_bloqueo', 'fecha_accion', 'codigo_error']),
    );
  });

  it('deja la versión del esquema en la última migración y no las repite al reabrir', async () => {
    const db = await getDb();
    const { user_version } = (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))!;
    // 6 al escribir este test; al agregar migraciones solo sube
    expect(user_version).toBeGreaterThanOrEqual(6);
    expect(await getDb()).toBe(db);
  });

  it('guarda, lee y borra ajustes como JSON', async () => {
    await guardarAjuste('prueba', { a: 1, lista: [true, 'x'] });
    expect(await leerAjuste('prueba')).toEqual({ a: 1, lista: [true, 'x'] });

    await guardarAjuste('prueba', null);
    expect(await leerAjuste('prueba')).toBeNull();
  });
});
