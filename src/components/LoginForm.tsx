import { AlertCircle, ArrowRight, Lock, User } from 'lucide-react-native';
import React from 'react';
import { Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { darkTheme, lightTheme } from '../constants/theme';
import { styles } from './LoginForm.styles';

interface LoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  errorMsg: string | null;
  onSubmit: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  errorMsg,
  onSubmit,
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <View style={styles.formContainer}>
      {errorMsg && (
        <View style={[
          styles.errorBox,
          { backgroundColor: 'rgba(244, 63, 94, 0.15)', borderColor: 'rgba(244, 63, 94, 0.4)' }
        ]}>
          <AlertCircle size={16} color={theme.danger} />
          <Text style={[styles.errorText, { color: theme.danger }]}>{errorMsg}</Text>
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
            secureTextEntry
          />
        </View>
      </View>

      {/* Primary Action Button */}
      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
        onPress={onSubmit}
      >
        <Text style={styles.submitButtonText}>Iniciar Sesión</Text>
        <ArrowRight size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};
