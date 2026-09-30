import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme, StyleProp, ViewStyle } from 'react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { LucideIcon } from 'lucide-react-native';
import { styles } from './ActionCard.styles';

interface Props {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  subtitle: string;
  badgeText: string;
  disabled?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ActionCard: React.FC<Props> = ({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  badgeText,
  disabled = false,
  onPress,
  style
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        disabled && { opacity: 0.5 },
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.badgeContainer}>
        <Text style={[styles.badgeText, { color: theme.textTertiary }]}>{badgeText}</Text>
      </View>
      <View style={[styles.iconCircle, { borderColor: iconColor }]}>
        <Icon size={24} color={iconColor} />
      </View>
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={3}>{subtitle}</Text>
    </TouchableOpacity>
  );
};
