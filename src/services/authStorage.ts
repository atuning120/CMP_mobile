import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Operador } from '../types/mining';
import { CredencialOffline } from './credencialOffline';

const SESSION_KEY = 'cmp_secure_session_v2';
// Formato anterior: guardaba la contraseña en texto plano. Se elimina al leer.
const LEGACY_SESSION_KEY = 'cmp_secure_session';
const OPERADOR_CACHE_KEY = '@cmp_cache_operador';
// Cuenta (correo + contraseña) que el usuario pidió recordar en el login. Va cifrada en SecureStore,
// aparte de la sesión, para que sobreviva al cierre de sesión.
const CUENTA_RECORDADA_KEY = 'cmp_cuenta_recordada';

// Por seguridad la contraseña recordada (y con ella la entrada automática) vence a los N días del último
// ingreso escrito a mano. Las entradas automáticas no renuevan el plazo.
export const RECORDAR_CUENTA_DIAS = 5;

export interface CuentaRecordada {
  correo: string;
  // null cuando venció el plazo: solo se sigue rellenando el correo
  contrasena: string | null;
  // true desde el login hasta que el usuario cierra sesión: al abrir la app se entra sin pasar por el login
  sesionAbierta: boolean;
  guardadaEn: string; // ISO 8601, último ingreso con la contraseña escrita
}

const cuentaVencida = (cuenta: CuentaRecordada) => {
  const guardadaEn = new Date(cuenta.guardadaEn).getTime();
  return !Number.isFinite(guardadaEn) || Date.now() - guardadaEn > RECORDAR_CUENTA_DIAS * 24 * 60 * 60 * 1000;
};

export interface TokensSesion {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiraEn: string; // ISO 8601
}

/**
 * Sesión persistida en SecureStore (Keychain / Keystore). Contiene los tokens del Backend y el
 * verificador de la contraseña para el login offline; nunca la contraseña en claro.
 */
export interface SesionGuardada {
  version: 2;
  identificador: string; // email o RUT normalizado
  rol: string;
  idOperador: number | null;
  credencial: CredencialOffline;
  // Última vez que el Backend confirmó la identidad (login o refresh). Limita el uso offline.
  ultimaValidacionOnline: string; // ISO 8601
  // null tras cerrar sesión con conexión o si el Backend invalidó la sesión: se recupera con un login online.
  // Un logout sin conexión los conserva, para que la sesión siga renovándose al volver la red.
  tokens: TokensSesion | null;
}

export const normalizarIdentificador = (identificador: string) => identificador.trim().toLowerCase();

export const leerSesion = async (): Promise<SesionGuardada | null> => {
  try {
    await SecureStore.deleteItemAsync(LEGACY_SESSION_KEY).catch(() => undefined);
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) return null;
    const sesion = JSON.parse(raw) as SesionGuardada;
    return sesion.version === 2 ? sesion : null;
  } catch (error) {
    console.error('Error leyendo la sesión guardada', error);
    return null;
  }
};

export const guardarSesion = async (sesion: SesionGuardada) => {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(sesion));
};

export const actualizarSesion = async (cambios: Partial<SesionGuardada>) => {
  const actual = await leerSesion();
  if (actual) await guardarSesion({ ...actual, ...cambios });
};

export const borrarSesion = async () => {
  await SecureStore.deleteItemAsync(SESSION_KEY).catch(() => undefined);
  await AsyncStorage.removeItem(OPERADOR_CACHE_KEY).catch(() => undefined);
};

export const guardarOperadorCache = async (operador: Operador) => {
  await AsyncStorage.setItem(OPERADOR_CACHE_KEY, JSON.stringify(operador));
};

export const leerOperadorCache = async (): Promise<Operador | null> => {
  const raw = await AsyncStorage.getItem(OPERADOR_CACHE_KEY);
  return raw ? (JSON.parse(raw) as Operador) : null;
};

/** Cuenta recordada. Si venció el plazo, borra la contraseña del teléfono y devuelve solo el correo. */
export const leerCuentaRecordada = async (): Promise<CuentaRecordada | null> => {
  try {
    const raw = await SecureStore.getItemAsync(CUENTA_RECORDADA_KEY);
    if (!raw) return null;
    const cuenta = JSON.parse(raw) as CuentaRecordada;
    if (cuenta.contrasena !== null && cuentaVencida(cuenta)) {
      const soloCorreo: CuentaRecordada = { ...cuenta, contrasena: null, sesionAbierta: false };
      await recordarCuenta(soloCorreo);
      return soloCorreo;
    }
    return cuenta;
  } catch {
    return null;
  }
};

/** Guarda la cuenta para el próximo login, o la olvida si se pasa null. */
export const recordarCuenta = async (cuenta: CuentaRecordada | null) => {
  if (cuenta) {
    await SecureStore.setItemAsync(
      CUENTA_RECORDADA_KEY,
      JSON.stringify({ ...cuenta, correo: cuenta.correo.trim() } satisfies CuentaRecordada),
    );
  } else {
    await SecureStore.deleteItemAsync(CUENTA_RECORDADA_KEY);
  }
};

/** Al cerrar sesión: la cuenta se sigue rellenando en el login, pero ya no se entra sola. */
export const marcarSesionCerrada = async () => {
  const cuenta = await leerCuentaRecordada();
  if (cuenta?.sesionAbierta) await recordarCuenta({ ...cuenta, sesionAbierta: false });
};

/**
 * Token para las peticiones a la API.
 */
export const getStoredToken = async (): Promise<string | null> => (await leerSesion())?.tokens?.accessToken ?? null;
