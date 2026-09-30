import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Operador } from '../types/mining';

const SECURE_STORE_PREFIX = 'cmp_secure_';
const CACHE_PREFIX = '@cmp_cache_';

/**
 * Guarda de forma segura las credenciales y la info del operador después de un login exitoso.
 * (Nota de seguridad: en producción, nunca guardar contraseñas en texto plano, usar hashes locales).
 */
export const saveSecureSession = async (email: string, passwordOrPin: string, token: string, operador: Operador) => {
  try {
    const sessionData = JSON.stringify({ email, passwordOrPin, token });
    await SecureStore.setItemAsync(`${SECURE_STORE_PREFIX}session`, sessionData);
    await AsyncStorage.setItem(`${CACHE_PREFIX}operador`, JSON.stringify(operador));
  } catch (error) {
    console.error('Error saving secure session', error);
  }
};

/**
 * Intenta hacer login offline validando las credenciales guardadas localmente.
 */
export const attemptOfflineLogin = async (email: string, passwordInput: string): Promise<Operador | null> => {
  try {
    const sessionString = await SecureStore.getItemAsync(`${SECURE_STORE_PREFIX}session`);
    if (!sessionString) return null;

    const sessionData = JSON.parse(sessionString);
    
    if (
      sessionData.email.toLowerCase() === email.toLowerCase() && 
      sessionData.passwordOrPin === passwordInput
    ) {
      // Credenciales válidas, retornamos el operador cacheado
      const operadorString = await AsyncStorage.getItem(`${CACHE_PREFIX}operador`);
      if (operadorString) {
        return JSON.parse(operadorString) as Operador;
      }
    }
    return null;
  } catch (error) {
    console.error('Error in offline login', error);
    return null;
  }
};

/**
 * Elimina la sesión actual (Logout).
 */
export const clearSecureSession = async () => {
  try {
    await SecureStore.deleteItemAsync(`${SECURE_STORE_PREFIX}session`);
    await AsyncStorage.removeItem(`${CACHE_PREFIX}operador`);
  } catch (error) {
    console.error('Error clearing secure session', error);
  }
};

import Constants from 'expo-constants';

/**
 * Obtiene el token guardado para futuras peticiones a la API.
 */
export const getStoredToken = async (): Promise<string | null> => {
  try {
    const sessionString = await SecureStore.getItemAsync(`${SECURE_STORE_PREFIX}session`);
    if (sessionString) {
      const sessionData = JSON.parse(sessionString);
      return sessionData.token;
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Realiza un login silencioso en segundo plano usando las credenciales guardadas.
 * Se llama cuando vuelve la conexión a internet.
 */
export const backgroundSyncLogin = async (): Promise<boolean> => {
  try {
    const sessionString = await SecureStore.getItemAsync(`${SECURE_STORE_PREFIX}session`);
    if (!sessionString) return false;

    const { email, passwordOrPin } = JSON.parse(sessionString);

    const debuggerHost = Constants.expoConfig?.hostUri;
    const backendIp = debuggerHost ? debuggerHost.split(':')[0] : '10.0.2.2';
    const backendUrl = `http://${backendIp}:3000/auth/login/operador`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: passwordOrPin }),
    });

    if (response.ok) {
      const data = await response.json();
      const sessionData = JSON.stringify({ email, passwordOrPin, token: data.accessToken });
      await SecureStore.setItemAsync(`${SECURE_STORE_PREFIX}session`, sessionData);
      console.log('✅ Sincronización en segundo plano exitosa. Nuevo token obtenido.');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error en sincronización en segundo plano', error);
    return false;
  }
};
