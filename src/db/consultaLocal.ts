import { ahoraIso, getDb } from './database';

/*
 * Copia local de las consultas del jefe de turno. Su vista sigue trabajando contra el Backend, pero
 * muestra primero lo último que recibió para cada consulta: así abre al instante y se puede revisar sin señal.
 */

// Rangos personalizados y filtros generan claves nuevas: se conservan solo las más recientes
const MAXIMO_CONSULTAS = 40;

export interface ConsultaGuardada<T> {
  datos: T;
  guardadoEn: string; // ISO 8601
}

export const leerConsulta = async <T>(clave: string): Promise<ConsultaGuardada<T> | null> => {
  const db = await getDb();
  const fila = await db.getFirstAsync<{ datos: string; guardado_en: string }>(
    'SELECT datos, guardado_en FROM consulta_guardada WHERE clave = ?',
    [clave],
  );
  return fila ? { datos: JSON.parse(fila.datos) as T, guardadoEn: fila.guardado_en } : null;
};

export const guardarConsulta = async (clave: string, datos: unknown) => {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO consulta_guardada (clave, datos, guardado_en) VALUES (?, ?, ?)', [
    clave,
    JSON.stringify(datos),
    ahoraIso(),
  ]);
  await db.runAsync(
    'DELETE FROM consulta_guardada WHERE clave NOT IN (SELECT clave FROM consulta_guardada ORDER BY guardado_en DESC LIMIT ?)',
    [MAXIMO_CONSULTAS],
  );
};
