import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { styles } from './MicrosoftLoginButton.styles';
import { lightTheme, darkTheme } from '../constants/theme';

interface MicrosoftLoginButtonProps {
  onPress: () => void;
}

export const MicrosoftLoginButton: React.FC<MicrosoftLoginButtonProps> = ({ onPress }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <TouchableOpacity 
      style={[
        styles.msButton, 
        { 
          backgroundColor: colorScheme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : theme.card, 
          borderColor: colorScheme === 'dark' ? '#334155' : theme.border 
        }
      ]} 
      onPress={onPress}
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
      <Text style={[styles.msButtonText, { color: theme.text }]}>Iniciar Sesión con Microsoft</Text>
    </TouchableOpacity>
  );
};
