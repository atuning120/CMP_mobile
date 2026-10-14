import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from './HomeScreen.styles';
import { LoginScreen } from './LoginScreen';
import { INITIAL_OPERADORES } from '../data/initialData';
import { Operador } from '../types/mining';
import { useNetInfo } from '@react-native-community/netinfo';
import { solicitarSincronizacion } from '../sync/syncEngine';

export default function HomeScreen() {
  const router = useRouter();
  const netInfo = useNetInfo();
  const networkState = netInfo.isConnected === false ? 'offline' : 'online';

  const handleLoginSuccess = (_operador: Operador, rol: string) => {
    // La sincronización que arranca con la app corrió sin sesión y no hizo nada: se pide otra ahora para
    // traer del servidor el turno que el operador pueda tener abierto (p. ej. app recién instalada)
    solicitarSincronizacion();
    // Los jefes de turno trabajan en la pantalla de supervisión; los operadores en la zona de trabajo
    router.replace(rol === 'JEFE_TURNO' ? '/ship-supervisor' : '/workzone');
  };

  return (
    <View style={styles.container}>
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        operadoresDisponibles={INITIAL_OPERADORES}
        networkState={networkState}
      />
    </View>
  );
}
