import { useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { FotoCapturada } from '../types/turno';

// Lado mayor de la foto guardada: suficiente para ver detalles de una falla y liviana para subir con mala señal
const LADO_MAXIMO_PX = 1600;
const CALIDAD_JPEG = 0.7;

/**
 * Reduce la foto a LADO_MAXIMO_PX y la guarda como JPEG comprimido (de varios MB a ~200-400 KB).
 */
const comprimir = async (foto: ImagePicker.ImagePickerAsset): Promise<FotoCapturada> => {
  const horizontal = foto.width >= foto.height;
  const ladoMayor = Math.max(foto.width, foto.height);
  const contexto = ImageManipulator.manipulate(foto.uri);
  if (ladoMayor > LADO_MAXIMO_PX) {
    contexto.resize(horizontal ? { width: LADO_MAXIMO_PX, height: null } : { width: null, height: LADO_MAXIMO_PX });
  }
  const imagen = await contexto.renderAsync();
  const resultado = await imagen.saveAsync({ compress: CALIDAD_JPEG, format: SaveFormat.JPEG });
  return { uri: resultado.uri, mimeType: 'image/jpeg' };
};

// La evidencia sale de la cámara o de la galería, nunca de ambas
export type OrigenFoto = 'camara' | 'galeria';

// Abre la cámara (pidiendo el permiso) o la galería del sistema, que no lo necesita, y comprime la imagen
const capturar = async (origen: OrigenFoto): Promise<FotoCapturada | null> => {
  const opciones: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, exif: false };
  let resultado: ImagePicker.ImagePickerResult;
  if (origen === 'camara') {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso de cámara', 'Activa el permiso de cámara en los ajustes del teléfono para adjuntar evidencias.');
      return null;
    }
    resultado = await ImagePicker.launchCameraAsync(opciones);
  } else {
    try {
      resultado = await ImagePicker.launchImageLibraryAsync({ ...opciones, allowsMultipleSelection: false });
    } catch (error) {
      // Una foto que solo está en la nube (p. ej. Google Fotos) no se puede leer sin conexión
      console.warn('No se pudo abrir la imagen de la galería', error);
      Alert.alert('No se pudo cargar la imagen', 'Elige una foto guardada en el teléfono o toma una con la cámara.');
      return null;
    }
  }
  if (resultado.canceled || resultado.assets.length === 0) return null;
  try {
    return await comprimir(resultado.assets[0]);
  } catch (error) {
    // Si la compresión falla, se usa la foto original antes que perder la evidencia
    console.warn('No se pudo comprimir la foto', error);
    const original = resultado.assets[0];
    return { uri: original.uri, mimeType: original.mimeType ?? 'image/jpeg' };
  }
};

/**
 * Abre la cámara o la galería y devuelve la imagen elegida, ya comprimida (o null si el operador cancela).
 */
export const useCapturaFoto = () => {
  // Un toque doble mientras la cámara o la galería se abre la lanzaría dos veces: el segundo toque se ignora
  const abierta = useRef(false);
  return useCallback(async (origen: OrigenFoto): Promise<FotoCapturada | null> => {
    if (abierta.current) return null;
    abierta.current = true;
    try {
      return await capturar(origen);
    } finally {
      abierta.current = false;
    }
  }, []);
};
