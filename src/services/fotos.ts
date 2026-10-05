import { Directory, File, Paths } from 'expo-file-system';

// Las fotos se copian a documentos (no a caché) para que el sistema no las borre antes de sincronizarlas
const directorioEvidencias = () => new Directory(Paths.document, 'evidencias');

/**
 * Copia la foto recién tomada (uri temporal de la cámara) al almacenamiento persistente de la app.
 */
export const guardarFotoLocal = async (uriTemporal: string, idCliente: string, mimeType: string): Promise<string> => {
  const directorio = directorioEvidencias();
  if (!directorio.exists) directorio.create({ intermediates: true });
  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/heic' ? 'heic' : 'jpg';
  const destino = new File(directorio, `${idCliente}.${extension}`);
  if (destino.exists) destino.delete();
  await new File(uriTemporal).copy(destino);
  return destino.uri;
};

export const eliminarFotoLocal = (uri: string) => {
  try {
    const archivo = new File(uri);
    if (archivo.exists) archivo.delete();
  } catch (error) {
    console.warn('No se pudo eliminar la foto local', error);
  }
};

export const existeFotoLocal = (uri: string) => {
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
};

/**
 * Agrega la foto a un multipart. Desde SDK 57 el `fetch` global es `expo/fetch`, que NO acepta el
 * objeto { uri, name, type } de React Native: el archivo se adjunta como `File` de expo-file-system
 * (implementa Blob). El tipo MIME lo deduce el Backend por la extensión del nombre si hace falta.
 */
export const adjuntarFoto = async (form: FormData, campo: string, uri: string, _mimeType: string, nombre: string) => {
  const archivo = new File(uri);
  if (!archivo.exists) throw new FotoNoEncontradaError(uri);
  form.append(campo, archivo as unknown as Blob, nombre);
};

// La copia local de la foto ya no existe (p. ej. se borraron los datos de la app)
export class FotoNoEncontradaError extends Error {
  constructor(uri: string) {
    super(`La foto ya no existe en el teléfono (${uri})`);
  }
}
