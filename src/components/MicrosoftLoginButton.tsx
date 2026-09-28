import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles, darkTheme, lightTheme } from './MicrosoftLoginButton.styles';
import { VisualContrastMode } from '../types/mining';

interface MicrosoftLoginButtonProps {
  onPress: () => void;
  contrastMode: VisualContrastMode;
}

export const MicrosoftLoginButton: React.FC<MicrosoftLoginButtonProps> = ({ onPress, contrastMode }) => {
  const isNight = contrastMode === 'night';
  const themeStyles = isNight ? darkTheme : lightTheme;

  return (
    <TouchableOpacity 
      style={[styles.msButton, themeStyles.msButtonTheme]} 
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
      <Text style={[styles.msButtonText, themeStyles.textPrimary]}>Iniciar Sesión con Microsoft</Text>
    </TouchableOpacity>
  );
};
