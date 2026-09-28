import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { User, Lock, ArrowRight, AlertCircle } from 'lucide-react-native';
import { styles, darkTheme, lightTheme } from './LoginForm.styles';
import { VisualContrastMode } from '../types/mining';

interface LoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  errorMsg: string | null;
  onSubmit: () => void;
  contrastMode: VisualContrastMode;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  errorMsg,
  onSubmit,
  contrastMode,
}) => {
  const isNight = contrastMode === 'night';
  const themeStyles = isNight ? darkTheme : lightTheme;

  return (
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
      <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
        <Text style={styles.submitButtonText}>Continuar al Turno</Text>
        <ArrowRight size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};
