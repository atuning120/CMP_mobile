import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { leerSesion } from '../services/authStorage';
import { sincronizarSesion } from '../services/authService';
import { adelantarReintentos } from './colaSync';
import { refrescarContadores, sincronizar } from './syncEngine';

const INTERVALO_MS = 60 * 1000;

/**
 * Arranca la sincronización en segundo plano. Se dispara al recuperar la conexión, al volver la
 * app a primer plano y cada minuto mientras está abierta. Devuelve la función para detenerla.
 */
export const iniciarMotorSync = () => {
  let conectado: boolean | null = null;

  const alRecuperarRed = async () => {
    // Primero la sesión (refresh token o login silencioso tras un ingreso offline), luego los datos
    await sincronizarSesion();
    const sesion = await leerSesion();
    if (sesion?.idOperador) await adelantarReintentos(sesion.idOperador);
    await sincronizar();
  };

  const desuscribirRed = NetInfo.addEventListener((estado) => {
    const ahora = estado.isConnected === true && estado.isInternetReachable !== false;
    if (ahora && conectado === false) {
      console.log('🌐 Conexión recuperada. Sincronizando en segundo plano...');
      void alRecuperarRed();
    }
    conectado = ahora;
  });

  const suscripcionApp = AppState.addEventListener('change', (estado) => {
    if (estado === 'active') void sincronizar();
  });

  const intervalo = setInterval(() => {
    if (AppState.currentState === 'active' && conectado !== false) void sincronizar();
  }, INTERVALO_MS);

  void refrescarContadores();
  void sincronizar();

  return () => {
    desuscribirRed();
    suscripcionApp.remove();
    clearInterval(intervalo);
  };
};
