import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'space-between' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerRight: { alignItems: 'flex-end' },
  terminalText: {
    fontSize: 10,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    color: '#94a3b8',
    marginBottom: 2,
  },
  flotaContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flotaText: { fontSize: 12, fontWeight: 'bold', color: '#f59e0b' },
  
  mainContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  titleContainer: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14 },
  
  quickSelectSection: { marginBottom: 20 },
  quickSelectGrid: { flexDirection: 'row', gap: 8 },
  quickOpButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  quickOpSelected: {
    borderColor: '#00A3E0',
    backgroundColor: 'rgba(0, 163, 224, 0.15)',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: { backgroundColor: '#00A3E0' },
  avatarUnselected: { backgroundColor: '#334155' },
  avatarText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  quickOpInfo: { flex: 1 },
  quickOpName: { fontSize: 12, fontWeight: 'bold' },
  quickOpRut: { fontSize: 10, fontFamily: 'monospace' },
  
  formContainer: { gap: 16 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  errorText: { color: '#f87171', fontSize: 12 },
  inputGroup: { gap: 6 },
  label: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  inputWrapper: { position: 'relative', justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 12, zIndex: 1 },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 40,
    paddingRight: 12,
    fontSize: 14,
  },
  submitButton: {
    height: 56,
    backgroundColor: '#00A3E0',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: '#00A3E0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  dividerContainer: { marginVertical: 24, alignItems: 'center', justifyContent: 'center' },
  dividerLine: { position: 'absolute', width: '100%', borderTopWidth: 1 },
  dividerTextWrapper: { paddingHorizontal: 10 },
  dividerText: { fontSize: 11, textTransform: 'uppercase', color: '#94a3b8' },
  
  msButton: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  msLogo: { width: 18, height: 18, gap: 1 },
  msLogoRow: { flexDirection: 'row', flex: 1, gap: 1 },
  msLogoSquare: { flex: 1 },
  msButtonText: { fontSize: 14, fontWeight: 'bold' },
  
  offlineNotice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  offlineLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  offlineText: { fontSize: 11, color: '#94a3b8' },
  networkStatusText: { fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' },
  
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 11, color: '#94a3b8' },
  
  textWhite: { color: '#fff' },
  textWhiteOpacity: { color: 'rgba(255,255,255,0.7)' },
});

const darkTheme = StyleSheet.create({
  background: { backgroundColor: '#0A1017' },
  cardBackground: { backgroundColor: '#101824' },
  cardBorder: { borderColor: '#1e293b' },
  borderBottom: { borderBottomColor: '#1e293b' },
  borderTop: { borderTopColor: '#1e293b' },
  textPrimary: { color: '#ffffff' },
  textSecondary: { color: '#94a3b8' },
  textTertiary: { color: '#64748b' },
  inputBackground: { backgroundColor: '#0B121C', borderColor: '#334155' },
  quickOpUnselected: { backgroundColor: 'rgba(15, 23, 42, 0.6)', borderColor: '#1e293b' },
  msButtonTheme: { backgroundColor: 'rgba(15, 23, 42, 0.8)', borderColor: '#334155' },
});

const lightTheme = StyleSheet.create({
  background: { backgroundColor: '#f1f5f9' },
  cardBackground: { backgroundColor: '#ffffff' },
  cardBorder: { borderColor: '#e2e8f0' },
  borderBottom: { borderBottomColor: '#e2e8f0' },
  borderTop: { borderTopColor: '#e2e8f0' },
  textPrimary: { color: '#0f172a' },
  textSecondary: { color: '#64748b' },
  textTertiary: { color: '#94a3b8' },
  inputBackground: { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' },
  quickOpUnselected: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  msButtonTheme: { backgroundColor: '#ffffff', borderColor: '#cbd5e1' },
});
