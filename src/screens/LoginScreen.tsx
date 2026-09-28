import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2 } from 'lucide-react-native';

import { styles, darkTheme, lightTheme } from './LoginScreen.styles';
import { LoginHeader } from '../components/LoginHeader';
import { LoginForm } from '../components/LoginForm';
import { MicrosoftLoginButton } from '../components/MicrosoftLoginButton';
import { LoginFooter } from '../components/LoginFooter';

import { Operador, VisualContrastMode, NetworkState } from '../types/mining';

interface LoginScreenProps {
  onLoginSuccess: (operador: Operador) => void;
  operadoresDisponibles: Operador[];
  contrastMode: VisualContrastMode;
  networkState: NetworkState;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  operadoresDisponibles,
  contrastMode,
  networkState,
}) => {
  const [email, setEmail] = useState<string>('cnunez@contratistacmp.cl');
  const [password, setPassword] = useState<string>('••••••••');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedQuickOp, setSelectedQuickOp] = useState<Operador>(operadoresDisponibles[0]);

  const handleStandardLogin = () => {
    if (!email.trim()) {
      setErrorMsg('Por favor ingresa tu correo corporativo.');
      return;
    }

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
  };

  const handleQuickSelect = (op: Operador) => {
    setSelectedQuickOp(op);
    setEmail(op.email);
    setPassword('••••••••');
    setErrorMsg(null);
  };

  const isNight = contrastMode === 'night';
  const themeStyles = isNight ? darkTheme : lightTheme;

  return (
    <SafeAreaView style={[styles.safeArea, themeStyles.background]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Extracted Header Component */}
        <LoginHeader contrastMode={contrastMode} />

        {/* Main Login Card */}
        <View style={styles.mainContent}>
          <View style={[styles.card, themeStyles.cardBackground, themeStyles.cardBorder]}>
            {/* Card Title */}
            <View style={styles.titleContainer}>
              <Text style={[styles.title, themeStyles.textPrimary]}>Inicio de Sesión</Text>
              <Text style={[styles.subtitle, themeStyles.textSecondary]}>
                Registro individual de operador en cabina de faena.
              </Text>
            </View>

            {/* Quick Operator Selection */}
            <View style={styles.quickSelectSection}>
              <Text style={[styles.label, themeStyles.textSecondary]}>
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
                        isSelected ? styles.quickOpSelected : themeStyles.quickOpUnselected,
                      ]}
                    >
                      <View style={[styles.avatar, isSelected ? styles.avatarSelected : styles.avatarUnselected]}>
                        <Text style={styles.avatarText}>
                          {op.nombre[0]}{op.apellido[0]}
                        </Text>
                      </View>
                      <View style={styles.quickOpInfo}>
                        <Text style={[styles.quickOpName, isSelected ? styles.textWhite : themeStyles.textPrimary]} numberOfLines={1}>
                          {op.nombre} {op.apellido}
                        </Text>
                        <Text style={[styles.quickOpRut, isSelected ? styles.textWhiteOpacity : themeStyles.textTertiary]} numberOfLines={1}>
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
              contrastMode={contrastMode}
            />

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, themeStyles.borderBottom]} />
              <View style={[styles.dividerTextWrapper, themeStyles.cardBackground]}>
                <Text style={styles.dividerText}>O accede con Microsoft</Text>
              </View>
            </View>

            {/* Extracted Microsoft Button Component */}
            <MicrosoftLoginButton 
              contrastMode={contrastMode} 
              onPress={handleStandardLogin} 
            />
          </View>

          {/* Offline Support Notice */}
          <View style={styles.offlineNotice}>
            <View style={styles.offlineLeft}>
              <CheckCircle2 size={14} color="#34d399" />
              <Text style={styles.offlineText}>Soporte Offline-First</Text>
            </View>
            <Text style={styles.networkStatusText}>
              {networkState === 'online' ? '🟢 Conectado' : '🟠 Modo Local'}
            </Text>
          </View>
        </View>

        {/* Extracted Footer Component */}
        <LoginFooter contrastMode={contrastMode} />
      </ScrollView>
    </SafeAreaView>
  );
};
