import { CheckCircle2 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ImageBackground,
  ScrollView,
  Text,
  useColorScheme,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

import { useNetInfo } from '@react-native-community/netinfo';

import { saveSecureSession, attemptOfflineLogin } from '../services/authStorage';

import { LoginFooter } from '../components/LoginFooter';
import { LoginForm } from '../components/LoginForm';
import { LoginHeader } from '../components/LoginHeader';
import { MicrosoftLoginButton } from '../components/MicrosoftLoginButton';
import { ProfileChip } from '../components/ProfileChip';
import { styles } from './LoginScreen.styles';

import { darkTheme, lightTheme } from '../constants/theme';
import { NetworkState, Operador } from '../types/mining';

interface LoginScreenProps {
  onLoginSuccess: (operador: Operador) => void;
  operadoresDisponibles: Operador[];
  networkState: NetworkState;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  operadoresDisponibles,
  networkState,
}) => {
  //password hardcodeada. ESTO ES SOLO PARA PRUEBAS
  const [email, setEmail] = useState<string>('pedro.gomez@cmp.cl');
  const [password, setPassword] = useState<string>('miPassword123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedQuickOp, setSelectedQuickOp] = useState<Operador>(operadoresDisponibles[0]);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const netInfo = useNetInfo();

  const handleMicrosoftLogin = () => {
    router.push('/ship-supervisor');
  };

  const handleStandardLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor ingresa tu correo corporativo y contraseña.');
      return;
    }

    setErrorMsg(null);

    // Flujo Offline Explicito
    if (networkState === 'offline') {
      console.log('Modo offline detectado, intentando login local...');
      const cachedOperador = await attemptOfflineLogin(email, password);
      if (cachedOperador) {
        console.log('Login offline exitoso');
        onLoginSuccess(cachedOperador);
      } else {
        setErrorMsg('Credenciales inválidas o no hay sesión guardada para modo offline.');
      }
      return;
    }

    try {
      // Determine the backend IP dynamically from Expo or fallback to Android Emulator default
      const debuggerHost = Constants.expoConfig?.hostUri;
      const backendIp = debuggerHost ? debuggerHost.split(':')[0] : '10.0.2.2';
      const backendUrl = `http://${backendIp}:3000/auth/login/operador`;

      console.log('Intentando conectar al backend (Online):', backendUrl);

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Credenciales inválidas o error de servidor');
      }

      const data = await response.json();
      console.log('Login successful, token received:', data.accessToken);

      let finalOp: Operador;
      const matched = operadoresDisponibles.find(
        (op) => op.email.toLowerCase() === email.toLowerCase()
      );

      if (matched) {
        finalOp = matched;
      } else {
        finalOp = {
          id_operador: 105,
          nombre: email.split('@')[0],
          apellido: 'Operador',
          rut: '16.789.012-3',
          telefono: '+56 9 8899 7766',
          estado: 'En Faena',
          email,
          empresa: 'Servicio Movimiento de Material MLC',
          rol: 'Operador de Maquinaria',
        };
      }

      // Guardamos la sesión de manera segura para futuros logins offline
      await saveSecureSession(email, password, data.accessToken, finalOp);
      
      onLoginSuccess(finalOp);
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Si falló por un error de red (no del servidor), intentamos offline
      if (error.message === 'Failed to fetch' || error.message.includes('Network request failed')) {
        console.log('Fallo de red detectado, intentando login local...');
        const cachedOperador = await attemptOfflineLogin(email, password);
        if (cachedOperador) {
          console.log('Login offline de respaldo exitoso');
          onLoginSuccess(cachedOperador);
          return;
        }
      }

      setErrorMsg(error.message || 'Error al conectar con el servidor.');
    }
  };

  const handleQuickSelect = (op: Operador) => {
    setSelectedQuickOp(op);
    setEmail(op.email);
    setPassword('••••••••');
    setErrorMsg(null);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Extracted Header Component */}
        <LoginHeader showConnectionStatus />

        {/* Main Login Card */}
        <ImageBackground
          source={require('../../assets/images/Mina_fondo.jpg')}
          style={styles.mainContent}
          imageStyle={{ opacity: colorScheme === 'dark' ? 0.6 : 0.6 }}
        >
          <View style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border, shadowColor: colorScheme === 'dark' ? '#000' : '#000' }
          ]}>
            {/* Card Title */}
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: theme.text }]}>Inicio de Sesión</Text>
            </View>

            {/* Quick Operator Selection */}
            <View style={styles.quickSelectSection}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Operador en Turno (Acceso Rápido):
              </Text>
              <View style={styles.quickSelectGrid}>
                {operadoresDisponibles.slice(0, 2).map((op) => {
                  const isSelected = selectedQuickOp?.id_operador === op.id_operador;
                  return (
                    <ProfileChip
                      key={op.id_operador}
                      nombre={op.nombre}
                      apellido={op.apellido}
                      rut={op.rut}
                      isSelected={isSelected}
                      onPress={() => handleQuickSelect(op)}
                      style={{ flex: 1, padding: 10 }}
                    />
                  );
                })}
              </View>
            </View>

            {/* Extracted Form Component */}
            <LoginForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              errorMsg={errorMsg}
              onSubmit={handleStandardLogin}
            />

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { borderTopColor: theme.border }]} />
              <View style={[styles.dividerTextWrapper, { backgroundColor: theme.card }]}>
                <Text style={[styles.dividerText, { color: theme.textSecondary }]}>O accede con Microsoft</Text>
              </View>
            </View>

            {/* Extracted Microsoft Button Component */}
            <MicrosoftLoginButton onPress={handleMicrosoftLogin} />
            {/* Offline Support Notice */}
            <View style={styles.offlineNotice}>
              <View style={styles.offlineLeft}>
                <CheckCircle2 size={14} color={theme.success} />
                <Text style={[styles.offlineText, { color: theme.text }]}>Soporte Offline-First</Text>
              </View>
              <Text style={[styles.networkStatusText, { color: theme.text }]}>
                {networkState === 'online'
                  ? `🟢 Conectado ${netInfo.type === 'wifi' ? '(WiFi)' : netInfo.type === 'cellular' ? '(Móvil)' : ''}`
                  : '🟠 Modo Local'}
              </Text>
            </View>
          </View>

        </ImageBackground>

        {/* Extracted Footer Component */}
        <LoginFooter />
      </ScrollView>
    </SafeAreaView>
  );
};
