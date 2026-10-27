import { ahoraIso, getDb } from './database';

/*
 * Copia local de las consultas del jefe de turno. Su vista sigue trabajando contra el Backend, pero
 * muestra primero lo último que recibió para cada consulta: así abre al instante y se puede revisar sin señal.
 */

// Rangos personalizados y filtros generan claves nuevas: se conservan solo las más recientes. La flota y los catálogos
// de los formularios ("catalogo|...") son claves fijas y no cuentan
const MAXIMO_CONSULTAS = 40;
const SIN_LIMITE = "(clave = 'flota' OR clave LIKE 'catalogo|%')";

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
    `DELETE FROM consulta_guardada
      WHERE NOT ${SIN_LIMITE}
        AND clave NOT IN (SELECT clave FROM consulta_guardada WHERE NOT ${SIN_LIMITE} ORDER BY guardado_en DESC LIMIT ?)`,
    [MAXIMO_CONSULTAS],
  );
};

/**
 * Consulta al Backend y guarda la respuesta; si no responde (sin señal), devuelve la última guardada. Para los catálogos
 * de los formularios del jefe de turno (operadores, marcas, tipos, modelos), que así se pueden llenar sin señal.
 * Sin copia guardada, lanza el error del Backend.
 */
export const consultarConCopia = async <T>(clave: string, cargar: () => Promise<T>): Promise<T> => {
  try {
    const datos = await cargar();
    guardarConsulta(clave, datos).catch((e) => console.warn('No se pudo guardar la consulta', e));
    return datos;
  } catch (error) {
    const guardada = await leerConsulta<T>(clave).catch(() => null);
    if (guardada) return guardada.datos;
    throw error;
  }
};
