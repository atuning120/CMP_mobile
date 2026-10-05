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

import { useNetInfo } from '@react-native-community/netinfo';

import { AuthError, loginOffline, loginOnline, OFFLINE_MAX_DIAS } from '../services/authService';

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

    const intentarOffline = async (motivoSinRed: boolean) => {
      const resultado = await loginOffline(email, password);
      if (resultado.ok) {
        console.log('Login offline exitoso');
        onLoginSuccess(resultado.operador, resultado.rol);
        return;
      }
      setErrorMsg(
        resultado.motivo === 'credenciales'
          ? 'Correo o contraseña incorrectos.'
          : resultado.motivo === 'vencida'
            ? `Sin conexión: tu acceso offline venció (más de ${OFFLINE_MAX_DIAS} días sin validar). Conéctate para ingresar.`
            : motivoSinRed
              ? 'Sin conexión: para usar el modo offline primero debes ingresar una vez con conexión en este dispositivo.'
              : 'No se pudo conectar con el servidor. Revisa tu conexión e intenta nuevamente.',
      );
    };

    // Flujo Offline Explicito
    if (networkState === 'offline') {
      console.log('Modo offline detectado, intentando login local...');
      await intentarOffline(true);
      return;
    }

    // El operador mostrado sale de los perfiles de prueba hasta que el Backend exponga el perfil
    const matched = operadoresDisponibles.find(
      (op) => op.email.toLowerCase() === email.trim().toLowerCase()
    );
    const finalOp: Operador = matched ?? {
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

    try {
      // El backend responde con el rol (OPERADOR o JEFE_TURNO) para decidir la pantalla
      const { rol } = await loginOnline(email, password, finalOp);
      console.log('Login successful, rol:', rol);
      onLoginSuccess(finalOp, rol);
    } catch (error) {
      if (error instanceof AuthError && error.status > 0) {
        // Errores ya traducidos desde la respuesta del backend
        setErrorMsg(getLoginErrorMessage(error.status, error.code));
        return;
      }

      // Fallo de red (no del servidor): intentamos con la sesión guardada
      console.log('Fallo de red detectado, intentando login local...');
      await intentarOffline(false);
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
