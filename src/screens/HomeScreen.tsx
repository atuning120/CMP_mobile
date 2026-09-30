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

  const handleLoginSuccess = (operador: Operador) => {
    console.log('Login successful:', operador);
    // Navigate to the workzone screen
    router.replace('/workzone');
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
