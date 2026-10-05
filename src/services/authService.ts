import { Operador } from '../types/mining';
import { fetchBackend } from './backendUrl';
import { crearCredencialOffline, verificarCredencialOffline } from './credencialOffline';
import {
  actualizarSesion,
  borrarSesion,
  guardarOperadorCache,
  guardarSesion,
  leerOperadorCache,
  leerSesion,
  normalizarIdentificador,
  TokensSesion,
} from './authStorage';

/*
 * Flujo de sesión offline-first:
 * - Login online: el Backend valida la contraseña y entrega access + refresh token. Se guarda un
 *   verificador (hash) de la contraseña para poder entrar sin red.
 * - Login offline: se valida contra el verificador, siempre que el Backend haya confirmado la
 *   identidad hace menos de OFFLINE_MAX_DIAS.
 * - Al expirar el access token o volver la red, se renueva con el refresh token. Si no hay tokens
 *   (p. ej. login offline después de cerrar sesión), se hace un login online silencioso con la
 *   contraseña que el operador acaba de escribir, que solo se mantiene en memoria.
 */

export const OFFLINE_MAX_DIAS = 30;

export class AuthError extends Error {
  constructor(
    message: string,
    // 0 = sin conexión con el servidor
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
  }
}

interface SesionMovilApi {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiraEn: string;
  rol: 'OPERADOR' | 'JEFE_TURNO';
  idOperador?: number;
}

export type ResultadoSincronizacion = 'ok' | 'sin-conexion' | 'rechazada' | 'sin-sesion';

// Contraseña del último login offline, solo en memoria, para validarla online al recuperar la red
let credencialesPendientes: { identificador: string; password: string } | null = null;
// Evita varios refresh simultáneos (p. ej. varias peticiones que reciben 401 a la vez)
let sincronizacionEnCurso: Promise<ResultadoSincronizacion> | null = null;

const cuerpoLogin = (identificador: string, password: string) =>
  // El Backend acepta email o RUT
  JSON.stringify(identificador.includes('@') ? { email: identificador, password } : { rut: identificador, password });

const postAuth = async (path: string, body: string): Promise<Response> => {
  try {
    return await fetchBackend(path, { method: 'POST', body });
  } catch {
    throw new AuthError('No se pudo conectar con el servidor.', 0);
  }
};

const tokensDe = (data: SesionMovilApi): TokensSesion => ({
  accessToken: data.accessToken,
  refreshToken: data.refreshToken,
  refreshTokenExpiraEn: data.refreshTokenExpiraEn,
});

/**
 * Login contra el Backend. Lanza AuthError (status 0 si no hay conexión).
 */
export const loginOnline = async (identificador: string, password: string, operador: Operador): Promise<{ rol: string }> => {
  const id = normalizarIdentificador(identificador);
  const response = await postAuth('/auth/login', cuerpoLogin(id, password));
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new AuthError(errorData?.message ?? 'No se pudo iniciar sesión.', response.status, errorData?.code);
  }
  const data = (await response.json()) as SesionMovilApi;

  await guardarSesion({
    version: 2,
    identificador: id,
    rol: data.rol,
    idOperador: data.idOperador ?? null,
    credencial: await crearCredencialOffline(id, password),
    ultimaValidacionOnline: new Date().toISOString(),
    tokens: tokensDe(data),
  });
  await guardarOperadorCache(operador);
  credencialesPendientes = null;
  return { rol: data.rol };
};

export type ResultadoLoginOffline =
  | { ok: true; operador: Operador; rol: string }
  | { ok: false; motivo: 'sin-sesion' | 'credenciales' | 'vencida' };

/**
 * Login sin conexión contra el verificador guardado en el último login online.
 */
export const loginOffline = async (identificador: string, password: string): Promise<ResultadoLoginOffline> => {
  const id = normalizarIdentificador(identificador);
  const sesion = await leerSesion();
  const operador = await leerOperadorCache();
  if (!sesion || !operador) return { ok: false, motivo: 'sin-sesion' };

  if (sesion.identificador !== id || !(await verificarCredencialOffline(sesion.credencial, id, password))) {
    return { ok: false, motivo: 'credenciales' };
  }

  const diasSinValidar = (Date.now() - new Date(sesion.ultimaValidacionOnline).getTime()) / (24 * 60 * 60 * 1000);
  if (diasSinValidar > OFFLINE_MAX_DIAS) return { ok: false, motivo: 'vencida' };

  credencialesPendientes = { identificador: id, password };
  return { ok: true, operador, rol: sesion.rol };
};

const refrescar = async (refreshToken: string): Promise<ResultadoSincronizacion> => {
  let response: Response;
  try {
    response = await postAuth('/auth/refresh', JSON.stringify({ refreshToken }));
  } catch {
    return 'sin-conexion';
  }
  if (response.status === 401) return 'rechazada';
  if (!response.ok) return 'sin-conexion'; // error transitorio del servidor: se reintenta luego

  const data = (await response.json()) as SesionMovilApi;
  await actualizarSesion({
    tokens: tokensDe(data),
    rol: data.rol,
    idOperador: data.idOperador ?? null,
    ultimaValidacionOnline: new Date().toISOString(),
  });
  return 'ok';
};

const sincronizar = async (): Promise<ResultadoSincronizacion> => {
  const sesion = await leerSesion();

  if (sesion?.tokens) {
    const resultado = await refrescar(sesion.tokens.refreshToken);
    if (resultado !== 'rechazada') return resultado;
    // El Backend invalidó la sesión (expirada, usuario desactivado o revocada)
    await actualizarSesion({ tokens: null });
  }

  if (credencialesPendientes) {
    const { identificador, password } = credencialesPendientes;
    const operador = await leerOperadorCache();
    try {
      if (operador) {
        await loginOnline(identificador, password, operador);
        return 'ok';
      }
    } catch (error) {
      if (error instanceof AuthError && error.status === 0) return 'sin-conexion';
      if (error instanceof AuthError && (error.status === 401 || error.status === 403)) {
        // La contraseña cambió o el usuario fue desactivado: el acceso offline deja de ser válido
        credencialesPendientes = null;
        await borrarSesion();
        return 'rechazada';
      }
      return 'sin-conexion';
    }
  }

  return sesion?.tokens ? 'rechazada' : 'sin-sesion';
};

/**
 * Renueva la sesión con el Backend (refresh token o login silencioso tras un login offline).
 * Se llama al recibir un 401 y al recuperar la conexión.
 */
export const sincronizarSesion = (): Promise<ResultadoSincronizacion> => {
  if (!sincronizacionEnCurso) {
    sincronizacionEnCurso = sincronizar().finally(() => {
      sincronizacionEnCurso = null;
    });
  }
  return sincronizacionEnCurso;
};

/**
 * Cierra la sesión del dispositivo. El turno NO se cierra (vive en el Backend) y se conserva el
 * verificador de la contraseña para volver a entrar sin conexión.
 * - Con conexión: se revoca el refresh token en el Backend y se borran los tokens.
 * - Sin conexión: los tokens se conservan. Así, en una faena que pasa mayormente offline, el
 *   próximo ingreso (offline) sigue teniendo una sesión que se renueva sola apenas haya red,
 *   en vez de depender de un login online con contraseña.
 */
export const cerrarSesion = async () => {
  credencialesPendientes = null;
  const sesion = await leerSesion();
  if (!sesion?.tokens) return;

  try {
    const response = await postAuth('/auth/logout', JSON.stringify({ refreshToken: sesion.tokens.refreshToken }));
    if (response.ok) await actualizarSesion({ tokens: null });
  } catch {
    // Sin conexión: se mantiene la sesión para que se siga renovando al volver la red
  }
};
