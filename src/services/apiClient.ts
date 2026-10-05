import { getStoredToken } from './authStorage';
import { sincronizarSesion } from './authService';
import { fetchBackend } from './backendUrl';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
  }
}

const enviar = async (path: string, init: RequestInit): Promise<Response> => {
  const token = await getStoredToken();
  try {
    return await fetchBackend(path, {
      ...init,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión e intenta nuevamente.', 0);
  }
};

/**
 * fetch autenticado con el JWT guardado. Si el access token expiró, renueva la sesión y reintenta
 * una vez. Lanza ApiError con el `code` que envía el backend.
 */
export const apiRequest = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  let response = await enviar(path, init);

  if (response.status === 401) {
    const resultado = await sincronizarSesion();
    if (resultado === 'ok') {
      response = await enviar(path, init);
    } else if (resultado === 'sin-conexion') {
      throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión e intenta nuevamente.', 0);
    }
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
