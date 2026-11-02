import React from 'react';
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, ListChecks } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { useSyncStatus } from '../../hooks/useSyncStatus';
import { styles } from './AvisoAccionesPendientes.styles';

// Acciones hechas sin señal que el servidor rechazó o que esperan confirmación (más de 24 h): lleva a la bandeja
export const AvisoAccionesPendientes: React.FC = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const { errores, porConfirmar } = useSyncStatus();
  const total = errores + porConfirmar;
  if (total === 0) return null;
  const acento = errores > 0 ? theme.danger : theme.warning;

  return (
    <TouchableOpacity
      style={[styles.aviso, { backgroundColor: theme.glassSurface, borderColor: acento + '80' }]}
      onPress={() => router.push('/acciones-pendientes')}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <View style={[styles.icono, { backgroundColor: acento + '26' }]}>
        <ListChecks size={18} color={acento} />
      </View>
      <View style={styles.textos}>
        <Text style={[styles.titulo, { color: theme.text }]}>
          {total === 1 ? '1 acción hecha sin señal necesita tu decisión' : `${total} acciones hechas sin señal necesitan tu decisión`}
        </Text>
        <Text style={[styles.detalle, { color: theme.textSecondary }]}>Revísalas en Acciones pendientes</Text>
      </View>
      <ChevronRight size={18} color={theme.textSecondary} />
    </TouchableOpacity>
  );
};
