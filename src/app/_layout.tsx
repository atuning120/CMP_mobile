import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { useEffect, useRef } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { backgroundSyncLogin } from '../services/authStorage';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const netInfo = useNetInfo();
  const wasOffline = useRef<boolean>(false);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  // Listener para sincronización en segundo plano al recuperar red
  useEffect(() => {
    if (netInfo.isConnected === false) {
      wasOffline.current = true;
    } else if (netInfo.isConnected === true && wasOffline.current) {
      wasOffline.current = false;
      console.log('🌐 Conexión recuperada. Ejecutando sincronización en segundo plano...');
      backgroundSyncLogin();
    }
  }, [netInfo.isConnected]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </ThemeProvider>
  );
}
