import React from 'react';
import { Text, View } from 'react-native';
import { styles } from './CmpLogo.styles';

export const CmpLogo = ({ variant = 'auto' }: { variant?: 'auto' | 'dark' | 'light' }) => {
  const isDark = variant === 'dark';
  return (
    <View style={styles.container}>
      <Text style={[styles.text, isDark && styles.textDark]}>
        CMP Logo
      </Text>
    </View>
  );
};
