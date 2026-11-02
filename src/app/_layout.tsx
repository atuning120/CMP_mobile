import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View } from 'react-native';
import { useEffect } from 'react';
import { iniciarMotorSync } from '../sync/motorSync';
import { AvisoFlotante } from '../components/common/AvisoFlotante';
// Define la tarea de ubicación en segundo plano: debe existir apenas arranca la app
import '../services/seguimientoUbicacion';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  // Sincronización en segundo plano (sesión y datos offline) durante toda la vida de la app
  useEffect(() => iniciarMotorSync(), []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
        {/* Avisos de confirmación ("Turno iniciado"…), encima de cualquier pantalla */}
        <AvisoFlotante />
      </View>
    </ThemeProvider>
  );
}
