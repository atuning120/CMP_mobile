import { getDb, guardarAjuste, leerAjuste } from './database';

export type TipoCatalogo = 'maquina' | 'area' | 'zona' | 'estado';

/**
 * Reemplaza por completo un catálogo con lo que entregó el servidor (en una transacción, para
 * que la UI nunca vea un catálogo a medias).
 */
export const guardarCatalogo = async <T extends { id: number }>(
  tipo: TipoCatalogo,
  items: T[],
  idPadre: (item: T) => number | null = () => null,
) => {
  const db = await getDb();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync('DELETE FROM catalogo WHERE tipo = ?', [tipo]);
    for (const item of items) {
      await txn.runAsync('INSERT INTO catalogo (tipo, id, id_padre, datos) VALUES (?, ?, ?, ?)', [
        tipo,
        item.id,
        idPadre(item),
        JSON.stringify(item),
      ]);
    }
  });
  await guardarAjuste(`catalogo_actualizado:${tipo}`, new Date().toISOString());
};

export const leerCatalogo = async <T>(tipo: TipoCatalogo, idPadre?: number): Promise<T[]> => {
  const db = await getDb();
  const filas =
    idPadre === undefined
      ? await db.getAllAsync<{ datos: string }>('SELECT datos FROM catalogo WHERE tipo = ? ORDER BY rowid', [tipo])
      : await db.getAllAsync<{ datos: string }>('SELECT datos FROM catalogo WHERE tipo = ? AND id_padre = ? ORDER BY rowid', [
          tipo,
          idPadre,
        ]);
  return filas.map((fila) => JSON.parse(fila.datos) as T);
};

export const catalogoActualizadoEn = async (tipo: TipoCatalogo): Promise<Date | null> => {
  const valor = await leerAjuste<string>(`catalogo_actualizado:${tipo}`);
  return valor ? new Date(valor) : null;
};
