import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme, StyleProp, ViewStyle } from 'react-native';
import { darkTheme, lightTheme } from '../constants/theme';
import { styles } from './ProfileChip.styles';

interface ProfileChipProps {
  nombre: string;
  apellido: string;
  rut: string;
  isSelected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ProfileChip: React.FC<ProfileChipProps> = ({
  nombre,
  apellido,
  rut,
  isSelected = false,
  onPress,
  style
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const initial = `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      style={[
        styles.quickOpButton,
        {
          backgroundColor: isSelected ? theme.transparentPrimary : (colorScheme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc'),
          borderColor: isSelected ? theme.primary : (colorScheme === 'dark' ? '#1e293b' : '#e2e8f0'),
        },
        style
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: isSelected ? theme.primary : '#334155' }]}>
        <Text style={[styles.avatarText, { color: '#fff' }]}>{initial}</Text>
      </View>
      <View style={styles.quickOpInfo}>
        <Text style={[styles.quickOpName, { color: isSelected ? theme.text : theme.text }]} numberOfLines={1}>
          {nombre} {apellido}
        </Text>
        <Text style={[styles.quickOpRut, { color: isSelected ? theme.primary : theme.textTertiary }]} numberOfLines={1}>
          {rut}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
