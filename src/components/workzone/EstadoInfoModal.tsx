import React from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { CheckCircle2, X } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { EstadoOperacional } from '../../types/turno';
import { colorCategoria, etiquetaCategoria, IconoEstado, nombreCorto } from './estadoVisual';
import { styles } from './EstadoInfoModal.styles';

interface Props {
  estado: EstadoOperacional | null;
  esActivo: boolean;
  onClose: () => void;
  onSeleccionar: (estado: EstadoOperacional) => void;
}

/**
 * Ficha del botón "i": qué significa el estado y cómo cuenta en el desglose del turno.
 */
export const EstadoInfoModal: React.FC<Props> = ({ estado, esActivo, onClose, onSeleccionar }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  if (!estado) return null;
  const color = colorCategoria(estado.categoria, theme);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.fondo} onPress={onClose}>
        {/* Pressable interno: tocar la tarjeta no la cierra */}
        <Pressable style={[styles.tarjeta, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.encabezado}>
            <View style={[styles.icono, { backgroundColor: color + '20' }]}>
              <IconoEstado estado={estado} size={24} color={color} />
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityLabel="Cerrar">
              <X size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.titulo, { color: theme.text }]}>{nombreCorto(estado)}</Text>
          <View style={[styles.categoria, { backgroundColor: color + '20' }]}>
            <Text style={[styles.categoriaTexto, { color }]}>{etiquetaCategoria(estado.categoria).toUpperCase()}</Text>
          </View>

          <Text style={[styles.descripcion, { color: theme.textSecondary }]}>
            {estado.descripcion ?? 'Este estado aún no tiene una descripción registrada.'}
          </Text>

          <View style={[styles.dato, { borderColor: theme.border }]}>
            <Text style={[styles.datoEtiqueta, { color: theme.textTertiary }]}>¿Cuenta como hora efectiva?</Text>
            <Text style={[styles.datoValor, { color: estado.esProductivo ? theme.success : theme.textSecondary }]}>
              {estado.esProductivo ? 'Sí' : 'No'}
            </Text>
          </View>

          {esActivo ? (
            <View style={[styles.boton, { backgroundColor: color + '20' }]}>
              <CheckCircle2 size={18} color={color} />
              <Text style={[styles.botonTexto, { color }]}>ESTADO ACTUAL</Text>
            </View>
          ) : (
            <TouchableOpacity style={[styles.boton, { backgroundColor: color }]} onPress={() => onSeleccionar(estado)}>
              <Text style={[styles.botonTexto, { color: '#FFFFFF' }]}>CAMBIAR A ESTE ESTADO</Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};
