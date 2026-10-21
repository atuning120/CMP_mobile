import { getDb } from './database';

/*
 * Posiciones GPS del turno guardadas en el teléfono hasta que el adaptador confirma que las recibió. Sin
 * señal se acumulan y se envían todas al recuperarla, como hace un GPS real.
 */

// ~2,7 días a una posición cada 2 minutos; el Backend no acepta posiciones de más de 7 días
const MAXIMO_GUARDADAS = 2000;

export interface PosicionPendiente {
  id: number;
  idMaquina: number;
  fechaHora: string;
  latitud: number;
  longitud: number;
  velocidad: number | null;
  rumbo: number | null;
}

interface PosicionFila {
  id: number;
  id_maquina: number;
  fecha_hora: string;
  latitud: number;
  longitud: number;
  velocidad: number | null;
  rumbo: number | null;
}

export const guardarPosicion = async (posicion: Omit<PosicionPendiente, 'id'>) => {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO posicion_pendiente (id_maquina, fecha_hora, latitud, longitud, velocidad, rumbo) VALUES (?, ?, ?, ?, ?, ?)',
    [posicion.idMaquina, posicion.fechaHora, posicion.latitud, posicion.longitud, posicion.velocidad, posicion.rumbo],
  );
  // Si nunca hay señal no crece sin límite: se descartan las más antiguas
  await db.runAsync(
    'DELETE FROM posicion_pendiente WHERE id NOT IN (SELECT id FROM posicion_pendiente ORDER BY id DESC LIMIT ?)',
    [MAXIMO_GUARDADAS],
  );
};

export const listarPosicionesPendientes = async (limite: number): Promise<PosicionPendiente[]> => {
  const db = await getDb();
  const filas = await db.getAllAsync<PosicionFila>('SELECT * FROM posicion_pendiente ORDER BY id LIMIT ?', [limite]);
  return filas.map((f) => ({
    id: f.id,
    idMaquina: f.id_maquina,
    fechaHora: f.fecha_hora,
    latitud: f.latitud,
    longitud: f.longitud,
    velocidad: f.velocidad,
    rumbo: f.rumbo,
  }));
};

export const eliminarPosiciones = async (ids: number[]) => {
  if (ids.length === 0) return;
  const db = await getDb();
  await db.runAsync(`DELETE FROM posicion_pendiente WHERE id IN (${ids.map(() => '?').join(', ')})`, ids);
};
