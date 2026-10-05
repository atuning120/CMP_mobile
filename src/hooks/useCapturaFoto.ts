import { useCallback } from 'react';
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

/**
 * Abre la cámara y devuelve la foto tomada, ya comprimida (o null si el operador cancela).
 */
export const useCapturaFoto = () =>
  useCallback(async (): Promise<FotoCapturada | null> => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso de cámara', 'Activa el permiso de cámara en los ajustes del teléfono para adjuntar evidencias.');
      return null;
    }
    const resultado = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1, exif: false });
    if (resultado.canceled || resultado.assets.length === 0) return null;
    try {
      return await comprimir(resultado.assets[0]);
    } catch (error) {
      // Si la compresión falla, se usa la foto original antes que perder la evidencia
      console.warn('No se pudo comprimir la foto', error);
      const original = resultado.assets[0];
      return { uri: original.uri, mimeType: original.mimeType ?? 'image/jpeg' };
    }
  }, []);
