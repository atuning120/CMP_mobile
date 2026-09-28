import React from 'react';
import { View, Text } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { styles, darkTheme, lightTheme } from './LoginFooter.styles';
import { VisualContrastMode } from '../types/mining';

interface LoginFooterProps {
  contrastMode: VisualContrastMode;
}

export const LoginFooter: React.FC<LoginFooterProps> = ({ contrastMode }) => {
  const isNight = contrastMode === 'night';
  const themeStyles = isNight ? darkTheme : lightTheme;

  return (
    <View style={[styles.footer, themeStyles.borderTop]}>
      <View style={styles.footerRow}>
        <ShieldCheck size={14} color="#00A3E0" />
        <Text style={styles.footerText}>Gestión de Riesgo en los Procesos (GRP)</Text>
      </View>
      <Text style={styles.footerText}>Mina Los Colorados · CMP</Text>
    </View>
  );
};
