import { AlertCircle, ArrowRight, Lock, User, Eye, EyeOff, Square, SquareCheck } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { darkTheme, lightTheme } from '../constants/theme';
import { styles } from './LoginForm.styles';

interface LoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  errorMsg: string | null;
  onSubmit: () => void;
  recordarCuenta: boolean;
  setRecordarCuenta: (recordar: boolean) => void;
  // Mientras se valida el ingreso el botón queda deshabilitado y muestra el indicador de carga
  cargando?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  errorMsg,
  onSubmit,
  recordarCuenta,
  setRecordarCuenta,
  cargando = false,
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.formContainer}>
      {errorMsg && (
        <View style={[
          styles.errorBox,
          { backgroundColor: 'rgba(244, 63, 94, 0.15)', borderColor: 'rgba(244, 63, 94, 0.4)' }
        ]}>
          <AlertCircle size={16} color={theme.danger} />
          <Text style={[styles.errorText, { color: theme.dangerText }]}>{errorMsg}</Text>
        </View>
      )}

      {/* Email Field */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Correo Corporativo:</Text>
        <View style={styles.inputWrapper}>
          <View style={styles.inputIcon}>
            <User size={20} color={theme.textTertiary} />
          </View>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.cardAlt, borderColor: colorScheme === 'dark' ? '#334155' : theme.border, color: theme.text }
            ]}
            value={email}
            onChangeText={setEmail}
            placeholder="nombre.apellido@cmp.cl"
            placeholderTextColor={theme.textTertiary}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
      </View>

      {/* Password Field */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Contraseña / PIN de Operador:</Text>
        <View style={styles.inputWrapper}>
          <View style={styles.inputIcon}>
            <Lock size={20} color={theme.textTertiary} />
          </View>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.cardAlt, borderColor: colorScheme === 'dark' ? '#334155' : theme.border, color: theme.text }
            ]}
            value={password}
            onChangeText={setPassword}
            placeholder="Ingresa tu clave de cabina"
            placeholderTextColor={theme.textTertiary}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity 
            style={styles.passwordIcon} 
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
          >
            {showPassword ? (
              <EyeOff size={20} color={theme.textTertiary} />
            ) : (
              <Eye size={20} color={theme.textTertiary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Recordar cuenta: guarda solo el correo para el próximo ingreso */}
      <TouchableOpacity
        style={styles.recordarRow}
        onPress={() => setRecordarCuenta(!recordarCuenta)}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: recordarCuenta }}
        hitSlop={8}
      >
        {recordarCuenta ? (
          <SquareCheck size={20} color={theme.primary} />
        ) : (
          <Square size={20} color={theme.textTertiary} />
        )}
        <Text style={[styles.recordarText, { color: theme.textSecondary }]}>Recordar cuenta</Text>
      </TouchableOpacity>

      {/* Primary Action Button */}
      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: theme.primary, shadowColor: theme.primary, opacity: cargando ? 0.7 : 1 }]}
        onPress={onSubmit}
        disabled={cargando}
        accessibilityState={{ disabled: cargando, busy: cargando }}
      >
        <Text style={styles.submitButtonText}>{cargando ? 'Ingresando…' : 'Iniciar Sesión'}</Text>
        {cargando ? <ActivityIndicator size="small" color="#fff" /> : <ArrowRight size={20} color="#fff" />}
      </TouchableOpacity>
    </View>
  );
};
