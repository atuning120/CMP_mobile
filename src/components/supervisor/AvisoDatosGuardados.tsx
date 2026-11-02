import React from 'react';
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { CloudOff, RefreshCw } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { formatearFecha } from '../../utils/historialFechas';
import { styles } from './AvisoDatosGuardados.styles';

interface Props {
  // Cuándo se recibieron los datos a la vista; null = están al día y no se muestra nada
  guardadoEn: string | null;
  onReintentar: () => void;
}

// Avisa que la pestaña muestra lo último guardado en el teléfono porque el Backend no respondió
export const AvisoDatosGuardados: React.FC<Props> = ({ guardadoEn, onReintentar }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  if (!guardadoEn) return null;

  return (
    <View
      style={[styles.aviso, { backgroundColor: theme.glassSurface, borderColor: theme.warning + '80' }]}
      accessibilityRole="alert"
    >
      <View style={[styles.icono, { backgroundColor: theme.warning + '26' }]}>
        <CloudOff size={18} color={theme.warningText} />
      </View>
      <View style={styles.textos}>
        <Text style={[styles.titulo, { color: theme.text }]}>Mostrando datos guardados</Text>
        <Text style={[styles.detalle, { color: theme.textSecondary }]}>Actualizados {formatearFecha(guardadoEn)}</Text>
      </View>
      <TouchableOpacity
        onPress={onReintentar}
        style={[styles.reintentar, { borderColor: theme.border }]}
        accessibilityRole="button"
        accessibilityLabel="Reintentar actualización"
      >
        <RefreshCw size={14} color={theme.primary} />
        <Text style={[styles.reintentarTexto, { color: theme.primaryText }]}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
};
