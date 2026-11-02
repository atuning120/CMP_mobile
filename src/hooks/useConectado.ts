import { useNetInfo } from '@react-native-community/netinfo';

// Hay salida a internet. Mismo criterio que motorSync: un WiFi sin salida a internet no cuenta como conectado
export const useConectado = () => {
  const netInfo = useNetInfo();
  return netInfo.isConnected === true && netInfo.isInternetReachable !== false;
};
