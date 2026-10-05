import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Operador } from '../types/mining';
import { CredencialOffline } from './credencialOffline';

const SESSION_KEY = 'cmp_secure_session_v2';
// Formato anterior: guardaba la contraseña en texto plano. Se elimina al leer.
const LEGACY_SESSION_KEY = 'cmp_secure_session';
const OPERADOR_CACHE_KEY = '@cmp_cache_operador';

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

/**
 * Token para las peticiones a la API.
 */
export const getStoredToken = async (): Promise<string | null> => (await leerSesion())?.tokens?.accessToken ?? null;
