import React from 'react';
import { View, Text, useColorScheme, Appearance, TouchableOpacity } from 'react-native';
import { HardHat, Moon, Sun } from 'lucide-react-native';
import { CmpLogo } from './CmpLogo';
import { styles } from './LoginHeader.styles';
import { lightTheme, darkTheme } from '../constants/theme';

export const LoginHeader: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => {
    Appearance.setColorScheme(isDark ? 'light' : 'dark');
  };

  return (
    <View style={[styles.header, { borderBottomColor: theme.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CmpLogo variant={isDark ? 'dark' : 'auto'} />
        <TouchableOpacity 
          onPress={toggleTheme}
          style={{ 
            padding: 8, 
            borderRadius: 20, 
            backgroundColor: theme.cardAlt, 
            borderWidth: 1, 
            borderColor: theme.border 
          }}
        >
          {isDark ? (
            <Sun size={18} color={theme.warning} />
          ) : (
            <Moon size={18} color={theme.primary} />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.headerRight}>
        <Text style={[styles.terminalText, { color: theme.textSecondary }]}>Terminal Cabina MLC</Text>
        <View style={styles.flotaContainer}>
          <HardHat size={14} color={theme.warning} />
          <Text style={[styles.flotaText, { color: theme.warning }]}>Flota de Apoyo</Text>
        </View>
      </View>
    </View>
  );
};
