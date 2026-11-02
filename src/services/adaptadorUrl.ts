import Constants from 'expo-constants';

// Adaptador que recibe las posiciones por TCP (repo CMP_adaptadorTCP). Se define al compilar con
// EXPO_PUBLIC_ADAPTADOR_HOST y EXPO_PUBLIC_ADAPTADOR_PUERTO (eas.json o .env); Expo los incrusta en el bundle.
const HOST_CONFIGURADO = process.env.EXPO_PUBLIC_ADAPTADOR_HOST?.trim();
export const PUERTO_ADAPTADOR = Number(process.env.EXPO_PUBLIC_ADAPTADOR_PUERTO ?? 5023);

/**
 * Host del adaptador, o null si no hay uno: entonces la app no pide permisos ni envía ubicación.
 * En desarrollo, sin host configurado, se usa la IP del servidor de Expo (el adaptador corre en el mismo PC).
 */
export const getAdaptadorHost = (): string | null => {
  if (HOST_CONFIGURADO) return HOST_CONFIGURADO;
  const debuggerHost = Constants.expoConfig?.hostUri;
  return debuggerHost ? debuggerHost.split(':')[0] : null;
};
