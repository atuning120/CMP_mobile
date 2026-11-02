import { ahoraIso, getDb } from './database';

/*
 * Registro local de las acciones del jefe de turno hechas sin señal que salieron de la cola sin aplicarse (vencidas,
 * descartadas) o con un aviso que no debe perderse (el turno ya lo había cerrado otro). Se ve en "Acciones pendientes".
 */

// Se conservan las más recientes
const MAXIMO_REGISTROS = 200;

export type EventoRegistro = 'VENCIDA' | 'DESCARTADA' | 'TURNO_YA_CERRADO';

export interface RegistroAccion {
  id: number;
  evento: EventoRegistro;
  tipo: string;
  descripcion: string;
  detalle: string | null;
  fechaAccion: string | null;
  registradoEn: string;
}

export const registrarAccion = async (
  usuario: string,
  registro: { evento: EventoRegistro; tipo: string; descripcion: string; detalle: string | null; fechaAccion: string | null },
) => {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO registro_accion (usuario, evento, tipo, descripcion, detalle, fecha_accion, registrado_en)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [usuario, registro.evento, registro.tipo, registro.descripcion, registro.detalle, registro.fechaAccion, ahoraIso()],
  );
  await db.runAsync(
    'DELETE FROM registro_accion WHERE usuario = ? AND id NOT IN (SELECT id FROM registro_accion WHERE usuario = ? ORDER BY id DESC LIMIT ?)',
    [usuario, usuario, MAXIMO_REGISTROS],
  );
};

export const listarRegistroAcciones = async (usuario: string, limite = 50): Promise<RegistroAccion[]> => {
  const db = await getDb();
  const filas = await db.getAllAsync<{
    id: number;
    evento: EventoRegistro;
    tipo: string;
    descripcion: string;
    detalle: string | null;
    fecha_accion: string | null;
    registrado_en: string;
  }>('SELECT * FROM registro_accion WHERE usuario = ? ORDER BY id DESC LIMIT ?', [usuario, limite]);
  return filas.map((f) => ({
    id: f.id,
    evento: f.evento,
    tipo: f.tipo,
    descripcion: f.descripcion,
    detalle: f.detalle,
    fechaAccion: f.fecha_accion,
    registradoEn: f.registrado_en,
  }));
};
