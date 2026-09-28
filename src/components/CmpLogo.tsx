import React from 'react';
import { View, Image, useColorScheme } from 'react-native';
import { styles } from './CmpLogo.styles';

export const CmpLogo = ({ variant = 'auto' }: { variant?: 'auto' | 'dark' | 'light' }) => {
  const colorScheme = useColorScheme();
  
  let isDark = colorScheme === 'dark';
  if (variant === 'dark') isDark = true;
  if (variant === 'light') isDark = false;

  const logoSource = isDark 
    ? require('../../assets/images/CMP_logo_modo_oscuro.png')
    : require('../../assets/images/CMP_logo.png');

  return (
    <View style={styles.container}>
      <Image 
        source={logoSource} 
        style={styles.image} 
        resizeMode="contain" 
      />
    </View>
  );
};
