import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, darkTheme, lightTheme } from './LoginScreen.styles';
import { 
  User, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  HardHat, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react-native';
import { CmpLogo } from './CmpLogo';
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
        {/* Top Header / Branding Bar */}
        <View style={[styles.header, themeStyles.borderBottom]}>
          <CmpLogo variant={isNight ? 'dark' : 'auto'} />
          <View style={styles.headerRight}>
            <Text style={styles.terminalText}>Terminal Cabina MLC</Text>
            <View style={styles.flotaContainer}>
              <HardHat size={14} color="#f59e0b" />
              <Text style={styles.flotaText}>Flota de Apoyo</Text>
            </View>
          </View>
        </View>

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

            {/* Standard Form */}
            <View style={styles.formContainer}>
              {errorMsg && (
                <View style={styles.errorBox}>
                  <AlertCircle size={16} color="#f87171" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Email Field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, themeStyles.textSecondary]}>Correo Corporativo:</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <User size={20} color="#94a3b8" />
                  </View>
                  <TextInput
                    style={[styles.input, themeStyles.inputBackground, themeStyles.textPrimary]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="nombre.apellido@cmp.cl"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Password Field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, themeStyles.textSecondary]}>Contraseña / PIN de Operador:</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <Lock size={20} color="#94a3b8" />
                  </View>
                  <TextInput
                    style={[styles.input, themeStyles.inputBackground, themeStyles.textPrimary]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Ingresa tu clave de cabina"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry
                  />
                </View>
              </View>

              {/* Primary Action Button */}
              <TouchableOpacity style={styles.submitButton} onPress={handleStandardLogin}>
                <Text style={styles.submitButtonText}>Continuar al Turno</Text>
                <ArrowRight size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, themeStyles.borderBottom]} />
              <View style={[styles.dividerTextWrapper, themeStyles.cardBackground]}>
                <Text style={styles.dividerText}>O accede con Microsoft</Text>
              </View>
            </View>

            {/* Microsoft Sign-In Button */}
            <TouchableOpacity 
              style={[styles.msButton, themeStyles.msButtonTheme]} 
              onPress={() => {
                // Mock Microsoft Login
                handleStandardLogin();
              }}
            >
              <View style={styles.msLogo}>
                <View style={styles.msLogoRow}>
                  <View style={[styles.msLogoSquare, { backgroundColor: '#F25022' }]} />
                  <View style={[styles.msLogoSquare, { backgroundColor: '#7FBA00' }]} />
                </View>
                <View style={styles.msLogoRow}>
                  <View style={[styles.msLogoSquare, { backgroundColor: '#00A4EF' }]} />
                  <View style={[styles.msLogoSquare, { backgroundColor: '#FFB900' }]} />
                </View>
              </View>
              <Text style={[styles.msButtonText, themeStyles.textPrimary]}>Iniciar Sesión con Microsoft</Text>
            </TouchableOpacity>
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

        {/* Footer Info */}
        <View style={[styles.footer, themeStyles.borderTop]}>
          <View style={styles.footerRow}>
            <ShieldCheck size={14} color="#00A3E0" />
            <Text style={styles.footerText}>Gestión de Riesgo en los Procesos (GRP)</Text>
          </View>
          <Text style={styles.footerText}>Mina Los Colorados · CMP</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
