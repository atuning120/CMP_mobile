import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { ThemeColors } from '../constants/theme';
import { styles } from './StatusChip.styles';

export interface StatusChipProps {
  theme: ThemeColors;
  icon: LucideIcon;
  // Color del ícono (base) y del texto (variante legible); ver ThemeColors
  iconColor: string;
  textColor: string;
  label: string;
  onPress?: () => void;
}

/**
 * Cápsula de estado del header (conexión, sincronización). Sin onPress queda deshabilitada.
 */
export const StatusChip: React.FC<StatusChipProps> = ({ theme, icon: Icon, iconColor, textColor, label, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
    onPress={onPress}
    disabled={!onPress}
    accessibilityRole={onPress ? 'button' : 'text'}
  >
    <Icon size={14} color={iconColor} />
    <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
      {label}
    </Text>
  </TouchableOpacity>
);
