import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { CloudUpload, Info, LogOut } from 'lucide-react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { darkTheme, lightTheme } from '../../constants/theme';
import { styles } from './ConfirmLogoutModal.styles';

interface Props {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
  // Avisos adicionales según la pantalla (turno en curso, registros sin sincronizar)
  avisoTurno?: string | null;
  pendientesSincronizar?: number;
}

export const ConfirmLogoutModal: React.FC<Props> = ({ visible, onCancel, onConfirm, avisoTurno, pendientesSincronizar = 0 }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const [cerrando, setCerrando] = useState(false);

  const confirmar = async () => {
    setCerrando(true);
    try {
      await onConfirm();
    } finally {
      setCerrando(false);
    }
  };

  const cancelar = () => {
    if (!cerrando) onCancel();
  };

  return (
    // Animación propia y breve: la de Modal (animationType="fade") dura ~300 ms y no se puede ajustar
    <Modal visible={visible} transparent animationType="none" onRequestClose={cancelar}>
      <Animated.View style={styles.contenedor} entering={FadeIn.duration(120)}>
        <Pressable style={styles.fondo} onPress={cancelar}>
          <Animated.View style={styles.tarjetaAnimada} entering={ZoomIn.duration(150)}>
            <Pressable style={[styles.tarjeta, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.icono, { backgroundColor: theme.danger + '18' }]}>
                <LogOut size={24} color={theme.danger} />
              </View>
              <Text style={[styles.titulo, { color: theme.text }]}>¿Cerrar sesión?</Text>
              <Text style={[styles.mensaje, { color: theme.textSecondary }]}>
                Tendrás que ingresar nuevamente con tu correo y contraseña.
              </Text>

              {!!avisoTurno && (
                <View style={[styles.aviso, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
                  <Info size={16} color={theme.primary} />
                  <Text style={[styles.avisoTexto, { color: theme.text }]}>{avisoTurno}</Text>
                </View>
              )}
              {pendientesSincronizar > 0 && (
                <View style={[styles.aviso, { backgroundColor: theme.cardAlt, borderColor: theme.warning }]}>
                  <CloudUpload size={16} color={theme.warning} />
                  <Text style={[styles.avisoTexto, { color: theme.text }]}>
                    Tienes {pendientesSincronizar} registro{pendientesSincronizar === 1 ? '' : 's'} por sincronizar. Quedan guardados en
                    el teléfono y se enviarán cuando vuelvas a ingresar con conexión.
                  </Text>
                </View>
              )}

              <View style={styles.botones}>
                <TouchableOpacity
                  style={[styles.boton, { borderColor: theme.border, borderWidth: 1, backgroundColor: theme.background }]}
                  onPress={cancelar}
                  disabled={cerrando}
                >
                  <Text style={[styles.botonTexto, { color: theme.text }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.boton, { backgroundColor: theme.danger }]} onPress={confirmar} disabled={cerrando}>
                  {cerrando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={[styles.botonTexto, { color: '#FFFFFF' }]}>Cerrar sesión</Text>}
                </TouchableOpacity>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
};
