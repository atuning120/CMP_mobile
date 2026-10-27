import React from 'react';
import { View, Text, TouchableOpacity, Image, useColorScheme } from 'react-native';
import { Camera, CheckCircle2, ChevronRight, ImagePlus, Trash2 } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { OrigenFoto, useCapturaFoto } from '../../hooks/useCapturaFoto';
import { FotoCapturada } from '../../types/turno';
import { styles } from './FotoEvidenciaField.styles';

interface Props {
  foto: FotoCapturada | null;
  onChange: (foto: FotoCapturada | null) => void;
  // Texto de ayuda bajo el campo: qué conviene fotografiar
  ayuda: string;
  disabled?: boolean;
}

const OPCIONES: { origen: OrigenFoto; titulo: string; detalle: string; Icono: typeof Camera }[] = [
  { origen: 'camara', titulo: 'Tomar foto', detalle: 'Usar la cámara del teléfono', Icono: Camera },
  { origen: 'galeria', titulo: 'Subir imagen', detalle: 'Elegir una foto de la galería', Icono: ImagePlus },
];

/**
 * Evidencia fotográfica con vista previa: se toma con la cámara o se elige de la galería (una sola
 * imagen). La foto se guarda en el teléfono y se sube en segundo plano al sincronizar.
 */
export const FotoEvidenciaField: React.FC<Props> = ({ foto, onChange, ayuda, disabled = false }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const capturar = useCapturaFoto();

  const obtenerFoto = async (origen: OrigenFoto) => {
    const nueva = await capturar(origen);
    if (nueva) onChange(nueva);
  };

  const pie = <Text style={[styles.ayuda, { color: theme.textSecondary }]}>{ayuda}</Text>;

  if (foto) {
    return (
      <View style={{ opacity: disabled ? 0.5 : 1 }}>
        <View style={[styles.tarjeta, styles.vistaPrevia, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Image source={{ uri: foto.uri }} style={[styles.miniatura, { backgroundColor: theme.cardAlt }]} resizeMode="cover" />
          <View style={styles.vistaPreviaCuerpo}>
            <View style={styles.estado}>
              <CheckCircle2 size={16} color={theme.success} />
              <Text style={[styles.estadoTexto, { color: theme.text }]}>Foto adjunta</Text>
            </View>
            <Text style={[styles.estadoDetalle, { color: theme.textSecondary }]}>Se sube al sincronizar</Text>
            <View style={styles.acciones}>
              {OPCIONES.map(({ origen, Icono }) => (
                <TouchableOpacity
                  key={origen}
                  style={[styles.accion, { borderColor: theme.border }]}
                  onPress={() => obtenerFoto(origen)}
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityLabel={origen === 'camara' ? 'Reemplazar con una foto de la cámara' : 'Reemplazar con una imagen de la galería'}
                >
                  <Icono size={15} color={theme.primary} />
                  <Text style={[styles.accionTexto, { color: theme.primaryText }]}>{origen === 'camara' ? 'Cámara' : 'Galería'}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.accion, styles.accionIcono, { borderColor: theme.border }]}
                onPress={() => onChange(null)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel="Quitar foto"
              >
                <Trash2 size={15} color={theme.danger} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {pie}
      </View>
    );
  }

  return (
    <View style={{ opacity: disabled ? 0.5 : 1 }}>
      <View style={[styles.tarjeta, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {OPCIONES.map(({ origen, titulo, detalle, Icono }, indice) => (
          <TouchableOpacity
            key={origen}
            style={[styles.fila, indice > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}
            onPress={() => obtenerFoto(origen)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={titulo}
          >
            <View style={[styles.iconoBadge, { backgroundColor: theme.transparentPrimary }]}>
              <Icono size={20} color={theme.primary} />
            </View>
            <View style={styles.filaTextos}>
              <Text style={[styles.filaTitulo, { color: theme.text }]}>{titulo}</Text>
              <Text style={[styles.filaDetalle, { color: theme.textSecondary }]}>{detalle}</Text>
            </View>
            <ChevronRight size={18} color={theme.textTertiary} />
          </TouchableOpacity>
        ))}
      </View>
      {pie}
    </View>
  );
};
