import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

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

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  textDark: {
    color: '#ffffff',
  },
});
