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
import Constants from 'expo-constants';

import { useNetInfo } from '@react-native-community/netinfo';

import { saveSecureSession, attemptOfflineLogin } from '../services/authStorage';

import { LoginFooter } from '../components/LoginFooter';
import { LoginForm } from '../components/LoginForm';
import { LoginHeader } from '../components/LoginHeader';
import { ProfileChip } from '../components/ProfileChip';
import { styles } from './LoginScreen.styles';

import { darkTheme, lightTheme } from '../constants/theme';
import { NetworkState, Operador, PerfilPrueba } from '../types/mining';

// Mensajes que se muestran al usuario según el error del login. Nunca se muestra el texto crudo
// del servidor ni de la red.
const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  DATOS_INCOMPLETOS: 'Por favor ingresa tu correo corporativo y contraseña.',
  CREDENCIALES_INVALIDAS: 'Correo o contraseña incorrectos.',
  OPERADOR_INACTIVO: 'Tu cuenta de operador está inactiva. Contacta a tu jefe de turno.',
  SIN_ACCESO_APP: 'Tu usuario no tiene acceso a la aplicación móvil.',
};

const getLoginErrorMessage = (status: number, code?: string): string => {
  if (code && LOGIN_ERROR_MESSAGES[code]) return LOGIN_ERROR_MESSAGES[code];
  if (status === 400) return LOGIN_ERROR_MESSAGES.DATOS_INCOMPLETOS;
  if (status === 401) return LOGIN_ERROR_MESSAGES.CREDENCIALES_INVALIDAS;
  if (status === 403) return LOGIN_ERROR_MESSAGES.SIN_ACCESO_APP;
  return 'El servidor no pudo procesar el inicio de sesión. Intenta nuevamente en unos minutos.';
};

class LoginError extends Error {}

interface LoginScreenProps {
  onLoginSuccess: (operador: Operador, rol: string) => void;
  operadoresDisponibles: PerfilPrueba[];
  networkState: NetworkState;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  operadoresDisponibles,
  networkState,
}) => {
  //credenciales precargadas desde el acceso rápido. ESTO ES SOLO PARA PRUEBAS
  const [email, setEmail] = useState<string>(operadoresDisponibles[0].email);
  const [password, setPassword] = useState<string>(operadoresDisponibles[0].password);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedQuickOp, setSelectedQuickOp] = useState<PerfilPrueba>(operadoresDisponibles[0]);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const netInfo = useNetInfo();

  const handleStandardLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor ingresa tu correo corporativo y contraseña.');
      return;
    }

    setErrorMsg(null);

    // Flujo Offline Explicito
    if (networkState === 'offline') {
      console.log('Modo offline detectado, intentando login local...');
      const cachedSession = await attemptOfflineLogin(email, password);
      if (cachedSession) {
        console.log('Login offline exitoso');
        onLoginSuccess(cachedSession.operador, cachedSession.rol);
      } else {
        setErrorMsg('Credenciales inválidas o no hay sesión guardada para modo offline.');
      }
      return;
    }

    try {
      // Determine the backend IP dynamically from Expo or fallback to Android Emulator default
      const debuggerHost = Constants.expoConfig?.hostUri;
      const backendIp = debuggerHost ? debuggerHost.split(':')[0] : '10.0.2.2';
      const backendUrl = `http://${backendIp}:3000/auth/login`;

      console.log('Intentando conectar al backend (Online):', backendUrl);

      // El backend responde con el rol (OPERADOR o JEFE_TURNO) para decidir la pantalla
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new LoginError(getLoginErrorMessage(response.status, errorData?.code));
      }

      const data = await response.json();
      console.log('Login successful, rol:', data.rol);

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
      await saveSecureSession(email, password, data.accessToken, data.rol, finalOp);
      
      onLoginSuccess(finalOp, data.rol);
    } catch (error: any) {
      // Errores ya traducidos desde la respuesta del backend
      if (error instanceof LoginError) {
        setErrorMsg(error.message);
        return;
      }

      console.error('Login error:', error);

      // Si falló por un error de red (no del servidor), intentamos offline
      if (error.message === 'Failed to fetch' || error.message.includes('Network request failed')) {
        console.log('Fallo de red detectado, intentando login local...');
        const cachedSession = await attemptOfflineLogin(email, password);
        if (cachedSession) {
          console.log('Login offline de respaldo exitoso');
          onLoginSuccess(cachedSession.operador, cachedSession.rol);
          return;
        }
      }

      setErrorMsg('No se pudo conectar con el servidor. Revisa tu conexión e intenta nuevamente.');
    }
  };

  const handleQuickSelect = (op: PerfilPrueba) => {
    setSelectedQuickOp(op);
    setEmail(op.email);
    setPassword(op.password);
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
