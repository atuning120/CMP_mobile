import React from 'react';
import { Image, Text, View } from 'react-native';
import { ThemeColors } from '../constants/theme';
import { styles } from './GeoPlantaBrand.styles';

/**
 * Marca de la app: logo + nombre "GeoPlanta".
 */
export const GeoPlantaBrand: React.FC<{ theme: ThemeColors }> = ({ theme }) => (
  <View style={styles.container} accessible accessibilityLabel="GeoPlanta">
    <Image source={require('../../assets/images/geoplanta-logo.png')} style={styles.logo} resizeMode="contain" />
    <Text style={[styles.name, { color: theme.text }]}>GeoPlanta</Text>
  </View>
);
