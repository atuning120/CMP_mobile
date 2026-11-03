import React, { useEffect, useState } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from './HomeScreen.styles';
import { LoginScreen } from './LoginScreen';
import { Operador } from '../types/mining';
import { useNetInfo } from '@react-native-community/netinfo';
import { solicitarSincronizacion } from '../sync/syncEngine';
import { restaurarSesionRecordada } from '../services/authService';
import { darkTheme, lightTheme } from '../constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const netInfo = useNetInfo();
  const networkState = netInfo.isConnected === false ? 'offline' : 'online';
  const theme = useColorScheme() === 'dark' ? darkTheme : lightTheme;
  // Mientras se revisa si hay una sesión recordada no se muestra el login, para que no parpadee
  const [verificando, setVerificando] = useState(true);

  const handleLoginSuccess = (_operador: Operador, rol: string) => {
    // La sincronización que arranca con la app corrió sin sesión y no hizo nada: se pide otra ahora para
    // traer del servidor el turno que el operador pueda tener abierto (p. ej. app recién instalada)
    solicitarSincronizacion();
    // Los jefes de turno trabajan en la pantalla de supervisión; los operadores en la zona de trabajo
    router.replace(rol === 'JEFE_TURNO' ? '/ship-supervisor' : '/workzone');
  };

  // "Recordar cuenta" sin cierre de sesión: se entra directo a la pantalla del rol
  useEffect(() => {
    restaurarSesionRecordada()
      .catch(() => null)
      .then((sesion) => {
        if (sesion) handleLoginSuccess(sesion.operador, sesion.rol);
        else setVerificando(false);
      });
    // Solo al abrir la app
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (verificando) {
    return (
      <View style={[styles.container, styles.centrado, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        networkState={networkState}
      />
    </View>
  );
}
