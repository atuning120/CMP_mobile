import { HardHat, Moon, Sun } from 'lucide-react-native';
import React from 'react';
import { Appearance, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { darkTheme, lightTheme } from '../constants/theme';
import { CmpLogo } from './CmpLogo';
import { styles } from './LoginHeader.styles';

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
        <View style={styles.flotaContainer}>
          <HardHat size={14} color={theme.warning} />
          <Text style={[styles.flotaText, { color: theme.warning }]}>Sistema en Cabina MLC</Text>
        </View>
      </View>
    </View>
  );
};
