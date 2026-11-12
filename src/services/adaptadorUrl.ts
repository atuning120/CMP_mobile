import Constants, { ExecutionEnvironment } from 'expo-constants';

// Adaptador que recibe las posiciones por TCP (repo CMP_adaptadorTCP). Se define al compilar con
// EXPO_PUBLIC_ADAPTADOR_HOST y EXPO_PUBLIC_ADAPTADOR_PUERTO (eas.json o .env); Expo los incrusta en el bundle.
const HOST_CONFIGURADO = process.env.EXPO_PUBLIC_ADAPTADOR_HOST?.trim();
export const PUERTO_ADAPTADOR = Number(process.env.EXPO_PUBLIC_ADAPTADOR_PUERTO ?? 5023);

// Expo Go no trae el socket TCP (react-native-tcp-socket, nativo) ni, en Android, la ubicación en segundo plano:
// ahí el seguimiento queda apagado. Funciona en un development build o en la APK
export const enExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
if (enExpoGo) console.info('Expo Go: el envío de ubicación al adaptador está desactivado (requiere un development build)');

/**
 * Host del adaptador, o null si no hay uno (o si la app corre en Expo Go): entonces la app no pide permisos ni
 * envía ubicación. En desarrollo, sin host configurado, se usa la IP del servidor de Expo (el adaptador corre en el
 * mismo PC).
 */
export const getAdaptadorHost = (): string | null => {
  if (enExpoGo) return null;
  if (HOST_CONFIGURADO) return HOST_CONFIGURADO;
  const debuggerHost = Constants.expoConfig?.hostUri;
  return debuggerHost ? debuggerHost.split(':')[0] : null;
};
