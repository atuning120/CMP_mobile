import React from 'react';
import { View, Text } from 'react-native';
import { HardHat } from 'lucide-react-native';
import { CmpLogo } from './CmpLogo';
import { styles, darkTheme, lightTheme } from './LoginHeader.styles';
import { VisualContrastMode } from '../types/mining';

interface LoginHeaderProps {
  contrastMode: VisualContrastMode;
}

export const LoginHeader: React.FC<LoginHeaderProps> = ({ contrastMode }) => {
  const isNight = contrastMode === 'night';
  const themeStyles = isNight ? darkTheme : lightTheme;

  return (
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
  );
};
