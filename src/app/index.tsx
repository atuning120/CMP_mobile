import React from 'react';
import { View, useColorScheme } from 'react-native';
import { styles } from './index.styles';
import { LoginScreen } from '../components/LoginScreen';
import { INITIAL_OPERADORES } from '../data/initialData';
import { Operador } from '../types/mining';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const contrastMode = colorScheme === 'dark' ? 'night' : 'day';

  const handleLoginSuccess = (operador: Operador) => {
    console.log('Login successful:', operador);
    // In a real app, you would navigate to the Operator Hub or Main App screen here
  };

  return (
    <View style={styles.container}>
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        operadoresDisponibles={INITIAL_OPERADORES}
        contrastMode={contrastMode}
        networkState="online"
      />
    </View>
  );
};
