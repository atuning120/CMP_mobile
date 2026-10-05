import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from './HomeScreen.styles';
import { LoginScreen } from './LoginScreen';
import { INITIAL_OPERADORES } from '../data/initialData';
import { Operador } from '../types/mining';
import { useNetInfo } from '@react-native-community/netinfo';

export default function HomeScreen() {
  const router = useRouter();
  const netInfo = useNetInfo();
  const networkState = netInfo.isConnected === false ? 'offline' : 'online';

  const handleLoginSuccess = (operador: Operador, rol: string) => {
    console.log('Login successful:', operador, rol);
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
