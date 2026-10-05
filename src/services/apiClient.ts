import Constants from 'expo-constants';
import { getStoredToken } from './authStorage';

// Misma resolución de host que el login: IP del servidor de Expo o el alias del emulador Android.
export const getBackendBaseUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  const backendIp = debuggerHost ? debuggerHost.split(':')[0] : '10.0.2.2';
  return `http://${backendIp}:3000`;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
  }
}

/**
 * fetch autenticado con el JWT guardado. Lanza ApiError con el `code` que envía el backend.
 */
export const apiRequest = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const token = await getStoredToken();

  let response: Response;
  try {
    response = await fetch(`${getBackendBaseUrl()}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión e intenta nuevamente.', 0);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (response.status === 401) {
      throw new ApiError('Tu sesión expiró. Vuelve a iniciar sesión.', 401, errorData?.code);
    }
    throw new ApiError(errorData?.message ?? 'Ocurrió un error inesperado.', response.status, errorData?.code);
  }

  return response.json() as Promise<T>;
};
