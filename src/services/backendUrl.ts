import Constants from 'expo-constants';

// IP del servidor de Expo (dispositivo físico en la misma red) o el alias del emulador Android.
export const getBackendBaseUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  const backendIp = debuggerHost ? debuggerHost.split(':')[0] : '10.0.2.2';
  return `http://${backendIp}:3000`;
};

const TIMEOUT_MS = 15000;

/**
 * fetch con timeout: en faena la señal puede quedar "conectada" pero sin respuesta,
 * y sin límite la pantalla quedaría esperando indefinidamente.
 */
export const fetchBackend = async (path: string, init: RequestInit = {}): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${getBackendBaseUrl()}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } finally {
    clearTimeout(timer);
  }
};
