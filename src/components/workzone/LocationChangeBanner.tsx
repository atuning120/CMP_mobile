import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { MapPin, ChevronRight } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { styles } from './StateChangeBanner.styles';
import { TurnoActual } from '../../types/turno';

interface Props {
  turno: TurnoActual;
  onPress: () => void;
}

// Acceso al cambio de área/zona durante el turno; muestra dónde está trabajando ahora
export const LocationChangeBanner: React.FC<Props> = ({ turno, onPress }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const ubicacion = [turno.area?.nombre ?? 'Sin área', turno.zona?.nombre].filter(Boolean).join(' · ');

  return (
    <TouchableOpacity
      style={[styles.banner, { backgroundColor: theme.cardAlt, borderColor: theme.border, marginTop: 0 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: theme.primary }]}>
        <MapPin size={20} color="#FFFFFF" />
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.text }]}>CAMBIAR ÁREA O ZONA DE TRABAJO</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={2}>
          Ahora en: {ubicacion}
        </Text>
      </View>

      <ChevronRight size={24} color={theme.textTertiary} />
    </TouchableOpacity>
  );
};
