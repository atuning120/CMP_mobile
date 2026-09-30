import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { Clock, ChevronRight } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { styles } from './StateChangeBanner.styles';
import { EstadoOperacional } from '../../types/turno';

interface Props {
  onPress: () => void;
  estadosCatalogo: EstadoOperacional[];
}

export const StateChangeBanner: React.FC<Props> = ({ onPress, estadosCatalogo }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const nombresEstados = estadosCatalogo.map(e => e.nombre);
  let subtitulo = '';
  if (nombresEstados.length > 0) {
    if (nombresEstados.length === 1) {
      subtitulo = nombresEstados[0];
    } else {
      const ultimos = nombresEstados.pop();
      subtitulo = `${nombresEstados.join(', ')} o ${ultimos}`;
    }
  }

  return (
    <TouchableOpacity
      style={[styles.banner, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: theme.warning }]}>
        <Clock size={20} color="#000" />
      </View>

      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.text }]}>REGISTRAR CAMBIO DE ESTADO EN CABINA</Text>
          <View style={[styles.badge, { backgroundColor: theme.primary + '30' }]}>
            <Text style={[styles.badgeText, { color: theme.primary }]}>TÁCTIL</Text>
          </View>
        </View>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={2}>
          Pulsa para registrar: {subtitulo}
        </Text>
      </View>

      <ChevronRight size={24} color={theme.textTertiary} />
    </TouchableOpacity>
  );
};
