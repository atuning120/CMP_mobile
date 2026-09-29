import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { INITIAL_OPERADORES } from '../data/initialData';
import { Operador } from '../types/mining';
import { styles } from './HomeScreen.styles';
import { LoginScreen } from './LoginScreen';

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
