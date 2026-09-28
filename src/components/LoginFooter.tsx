import React from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { styles } from './LoginFooter.styles';
import { lightTheme, darkTheme } from '../constants/theme';

export const LoginFooter: React.FC = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <View style={[styles.footer, { borderTopColor: theme.border }]}>
      <View style={styles.footerRow}>
        <ShieldCheck size={14} color={theme.primary} />
        <Text style={[styles.footerText, { color: theme.textSecondary }]}>Gestión de Riesgo en los Procesos (GRP)</Text>
      </View>
      <Text style={[styles.footerText, { color: theme.textSecondary }]}>Mina Los Colorados · CMP</Text>
    </View>
  );
};
