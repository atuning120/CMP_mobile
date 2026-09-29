import { CheckCircle2 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

import { LoginFooter } from '../components/LoginFooter';
import { LoginForm } from '../components/LoginForm';
import { LoginHeader } from '../components/LoginHeader';
import { MicrosoftLoginButton } from '../components/MicrosoftLoginButton';
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
  const [email, setEmail] = useState<string>('cnunez@contratistacmp.cl');
  const [password, setPassword] = useState<string>('••••••••');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedQuickOp, setSelectedQuickOp] = useState<Operador>(operadoresDisponibles[0]);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const handleStandardLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor ingresa tu correo corporativo y contraseña.');
      return;
    }

    setErrorMsg(null);

    try {
      // Determine the backend IP dynamically from Expo or fallback to Android Emulator default
      const debuggerHost = Constants.expoConfig?.hostUri;
      const backendIp = debuggerHost ? debuggerHost.split(':')[0] : '10.0.2.2';
      const backendUrl = `http://${backendIp}:3000/auth/login/operador`;

      console.log('Intentando conectar al backend:', backendUrl);

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

      const matched = operadoresDisponibles.find(
        (op) => op.email.toLowerCase() === email.toLowerCase()
      );

      if (matched) {
        onLoginSuccess(matched);
      } else {
        const customOp: Operador = {
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
        onLoginSuccess(customOp);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setErrorMsg(error.message || 'Error al conectar con el servidor.');
    }
  };

  const handleQuickSelect = (op: Operador) => {
    setSelectedQuickOp(op);
    setEmail(op.email);
    //password hardcodeada. ESTO ES SOLO PARA PRUEBAS
    setPassword('miPassword123');
    setErrorMsg(null);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Extracted Header Component */}
        <LoginHeader />

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
                    <TouchableOpacity
                      key={op.id_operador}
                      onPress={() => handleQuickSelect(op)}
                      style={[
                        styles.quickOpButton,
                        {
                          backgroundColor: isSelected ? theme.transparentPrimary : (colorScheme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc'),
                          borderColor: isSelected ? theme.primary : (colorScheme === 'dark' ? '#1e293b' : '#e2e8f0'),
                        }
                      ]}
                    >
                      <View style={[
                        styles.avatar,
                        { backgroundColor: isSelected ? theme.primary : '#334155' }
                      ]}>
                        <Text style={[styles.avatarText, { color: '#fff' }]}>
                          {op.nombre[0]}{op.apellido[0]}
                        </Text>
                      </View>
                      <View style={styles.quickOpInfo}>
                        <Text style={[styles.quickOpName, { color: isSelected ? theme.text : theme.text }]} numberOfLines={1}>
                          {op.nombre} {op.apellido}
                        </Text>
                        <Text style={[styles.quickOpRut, { color: isSelected ? theme.primary : theme.textTertiary }]} numberOfLines={1}>
                          {op.rut}
                        </Text>
                      </View>
                    </TouchableOpacity>
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
            <MicrosoftLoginButton onPress={handleStandardLogin} />
            {/* Offline Support Notice */}
            <View style={styles.offlineNotice}>
              <View style={styles.offlineLeft}>
                <CheckCircle2 size={14} color={theme.success} />
                <Text style={[styles.offlineText, { color: theme.text }]}>Soporte Offline-First</Text>
              </View>
              <Text style={[styles.networkStatusText, { color: theme.text }]}>
                {networkState === 'online' ? '🟢 Conectado' : '🟠 Modo Local'}
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
