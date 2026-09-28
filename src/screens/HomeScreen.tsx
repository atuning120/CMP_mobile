import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from './HomeScreen.styles';
import { LoginScreen } from './LoginScreen';
import { INITIAL_OPERADORES } from '../data/initialData';
import { Operador } from '../types/mining';

export default function HomeScreen() {
  const router = useRouter();

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
        networkState="online"
      />
    </View>
  );
}
