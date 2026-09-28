import React from 'react';
import { Text, View, useColorScheme } from 'react-native';
import { styles } from './CmpLogo.styles';
import { lightTheme, darkTheme } from '../constants/theme';

export const CmpLogo = ({ variant = 'auto' }: { variant?: 'auto' | 'dark' | 'light' }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <View style={[styles.container, { borderColor: theme.primary, backgroundColor: theme.cardAlt }]}>
      <Text style={[styles.text, { color: theme.primary }]}>
        CMP Logo
      </Text>
    </View>
  );
};
