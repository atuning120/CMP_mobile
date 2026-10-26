import React, { useState } from 'react';
import { FlatList, Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { darkTheme } from '../../constants/theme';
import type { EvidenciaHistorial } from '../../services/historialService';
import { styles } from './VisorEvidencias.styles';

interface Props {
  evidencias: EvidenciaHistorial[];
  inicial: number;
  titulo: string;
  descripcion: string | null;
  fuente: (idEvidencia: string) => ImageSource;
  onCerrar: () => void;
}

const formatoFecha = (iso: string) => new Date(iso).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });

/**
 * Fotos de un reporte a pantalla completa, sobre fondo oscuro en ambos temas. Se desliza de lado para pasar
 * de una foto a otra; el botón atrás de Android cierra.
 */
export const VisorEvidencias: React.FC<Props> = ({ evidencias, inicial, titulo, descripcion, fuente, onCerrar }) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [indice, setIndice] = useState(inicial);
  const total = evidencias.length;
  const actual = evidencias[indice] ?? evidencias[0];
  const theme = darkTheme;

  return (
    <Modal visible animationType="fade" onRequestClose={onCerrar} statusBarTranslucent>
      <View style={[styles.fondo, { backgroundColor: theme.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <View style={styles.encabezado}>
            <Text style={[styles.titulo, { color: theme.text }]} numberOfLines={1}>
              {titulo}
            </Text>
            <Text style={[styles.subtitulo, { color: theme.textSecondary }]}>
              {total > 1 ? `Foto ${indice + 1} de ${total} · ` : ''}
              {formatoFecha(actual.fecha)}
            </Text>
          </View>
          <Pressable onPress={onCerrar} style={[styles.cerrar, { backgroundColor: theme.card }]} hitSlop={10} accessibilityLabel="Cerrar">
            <X size={22} color={theme.text} />
          </Pressable>
        </View>

        <FlatList
          data={evidencias}
          keyExtractor={(e) => e.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={inicial}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={(e) => setIndice(Math.round(e.nativeEvent.contentOffset.x / width))}
          style={styles.lista}
          renderItem={({ item }) => (
            <View style={[styles.pagina, { width }]}>
              <Image source={fuente(item.id)} style={styles.foto} contentFit="contain" cachePolicy="disk" accessibilityLabel={`Evidencia de ${titulo}`} />
            </View>
          )}
        />

        {!!descripcion && <Text style={[styles.descripcion, { color: theme.text, borderTopColor: theme.border }]}>{descripcion}</Text>}
      </View>
    </Modal>
  );
};
