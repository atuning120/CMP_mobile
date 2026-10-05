import Constants from 'expo-constants';

// URL del Backend desplegado (p. ej. Azure Container Apps). Se define al compilar el APK con
// EXPO_PUBLIC_API_URL (eas.json o .env); Expo la incrusta en el bundle.
const URL_CONFIGURADA = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');

// Sin URL configurada (desarrollo): IP del servidor de Expo (dispositivo físico en la misma red)
// o el alias del emulador Android.
export const getBackendBaseUrl = () => {
  if (URL_CONFIGURADA) return URL_CONFIGURADA;
  const debuggerHost = Constants.expoConfig?.hostUri;
  const backendIp = debuggerHost ? debuggerHost.split(':')[0] : '10.0.2.2';
  return `http://${backendIp}:3000`;
};

const TIMEOUT_MS = 15000;
// Las fotos pueden tardar más en subir con mala señal
export const TIMEOUT_SUBIDA_MS = 60000;

/**
 * fetch con timeout: en faena la señal puede quedar "conectada" pero sin respuesta,
 * y sin límite la pantalla quedaría esperando indefinidamente.
 */
export const fetchBackend = async (path: string, init: RequestInit = {}, timeoutMs = TIMEOUT_MS): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${getBackendBaseUrl()}${path}`, {
      ...init,
      signal: controller.signal,
      // FormData (subida de fotos) define su propio Content-Type con el boundary del multipart
      headers: { ...(typeof init.body === 'string' ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
    });
  } finally {
    clearTimeout(timer);
  }
};
