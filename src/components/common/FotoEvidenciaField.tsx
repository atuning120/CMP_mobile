import React from 'react';
import { View, Text, TouchableOpacity, Image, useColorScheme } from 'react-native';
import { Camera, RefreshCw, Trash2 } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { useCapturaFoto } from '../../hooks/useCapturaFoto';
import { FotoCapturada } from '../../types/turno';
import { styles } from './FotoEvidenciaField.styles';

interface Props {
  foto: FotoCapturada | null;
  onChange: (foto: FotoCapturada | null) => void;
  titulo: string;
  subtitulo: string;
  disabled?: boolean;
}

/**
 * Botón para tomar una foto de evidencia con vista previa. La foto se guarda en el teléfono y se
 * sube en segundo plano al sincronizar.
 */
export const FotoEvidenciaField: React.FC<Props> = ({ foto, onChange, titulo, subtitulo, disabled = false }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const capturar = useCapturaFoto();

  const tomarFoto = async () => {
    const nueva = await capturar();
    if (nueva) onChange(nueva);
  };

  if (foto) {
    return (
      <View style={[styles.vistaPrevia, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
        <Image source={{ uri: foto.uri }} style={styles.miniatura} resizeMode="cover" />
        <View style={styles.acciones}>
          <TouchableOpacity style={styles.accion} onPress={tomarFoto} disabled={disabled}>
            <RefreshCw size={16} color={theme.primary} />
            <Text style={[styles.accionTexto, { color: theme.primary }]}>Tomar otra</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.accion} onPress={() => onChange(null)} disabled={disabled}>
            <Trash2 size={16} color={theme.danger} />
            <Text style={[styles.accionTexto, { color: theme.danger }]}>Quitar foto</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.boton, { backgroundColor: theme.cardAlt, borderColor: theme.border, opacity: disabled ? 0.5 : 1 }]}
      onPress={tomarFoto}
      disabled={disabled}
    >
      <View style={[styles.iconoBadge, { backgroundColor: theme.primary + '15' }]}>
        <Camera size={26} color={theme.primary} />
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={[styles.titulo, { color: theme.text }]}>{titulo}</Text>
        <Text style={[styles.subtitulo, { color: theme.textSecondary }]}>{subtitulo}</Text>
      </View>
    </TouchableOpacity>
  );
};
