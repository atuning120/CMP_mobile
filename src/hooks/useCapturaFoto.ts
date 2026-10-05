import { useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { FotoCapturada } from '../types/turno';

/**
 * Abre la cámara y devuelve la foto tomada (o null si el operador cancela). La calidad se reduce
 * para que la subida sea viable con mala señal.
 */
export const useCapturaFoto = () =>
  useCallback(async (): Promise<FotoCapturada | null> => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso de cámara', 'Activa el permiso de cámara en los ajustes del teléfono para adjuntar evidencias.');
      return null;
    }
    const resultado = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6, exif: false });
    if (resultado.canceled || resultado.assets.length === 0) return null;
    const foto = resultado.assets[0];
    return { uri: foto.uri, mimeType: foto.mimeType ?? 'image/jpeg' };
  }, []);
