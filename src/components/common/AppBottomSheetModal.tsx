import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, useColorScheme, Platform, KeyboardAvoidingView, StyleProp, ViewStyle, BackHandler } from 'react-native';
import { X } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { darkTheme, lightTheme } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AppBottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  iconBadgeColor?: string;
  headerTop?: React.ReactNode;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollContentStyle?: StyleProp<ViewStyle>;
  modalStyle?: StyleProp<ViewStyle>;
  /**
   * Se dibuja como capa sobre la pantalla en vez de un <Modal> nativo. En Android cada Modal abre una
   * ventana nativa nueva y las animaciones de entrada arrancan tarde, lo que se nota sobre todo en
   * teléfonos de gama baja. Solo sirve si el componente es hijo directo (y último) de la raíz de la
   * pantalla: dentro de una vista anidada la capa quedaría recortada.
   */
  superpuesto?: boolean;
}

export const AppBottomSheetModal: React.FC<AppBottomSheetModalProps> = ({
  visible,
  onClose,
  title,
  icon,
  iconBadgeColor,
  headerTop,
  subtitle,
  headerRight,
  children,
  footer,
  scrollContentStyle,
  modalStyle,
  superpuesto = false,
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  // Sin Modal no hay onRequestClose: el botón "atrás" de Android se atiende aquí
  useEffect(() => {
    if (!superpuesto || !visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [superpuesto, visible, onClose]);

  if (superpuesto && !visible) return null;

  const hoja = (
    <Animated.View
      style={[styles.modalOverlay, superpuesto && styles.capa]}
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
    >
      <Animated.View
        entering={SlideInDown.springify().damping(28).stiffness(250).mass(0.8)}
        exiting={SlideOutDown.duration(200)}
        style={{ flexShrink: 1, width: '100%', alignItems: 'center' }}
      >
        {/* Como capa, la hoja va centrada dentro de la pantalla, que ya respeta las barras del sistema:
            los márgenes de área segura solo se suman dentro de la ventana del Modal */}
        <SafeAreaView
          style={[styles.modalContent, { backgroundColor: theme.card }, modalStyle]}
          edges={superpuesto ? [] : ['top', 'bottom']}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
            <View style={styles.headerLeft}>
              {icon && (
                <View style={[styles.iconBadge, { backgroundColor: iconBadgeColor || (theme.primary + '15') }]}>
                  {icon}
                </View>
              )}
              <View style={{ flexShrink: 1, justifyContent: 'center' }}>
                {headerTop && <View style={{ marginBottom: 4 }}>{headerTop}</View>}
                <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                  {title}
                </Text>
                {subtitle && (
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>{subtitle}</Text>
                )}
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {headerRight}
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.cardAlt }]}>
                <X size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flexShrink: 1 }}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[styles.scrollContent, scrollContentStyle]}
              showsVerticalScrollIndicator={true}
              // Permite tocar opciones de listas desplegables sin que el primer toque solo cierre el teclado
              keyboardShouldPersistTaps="handled"
            >
              {children}
              {/* Espacio final */}
              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Footer */}
          {footer && (
            <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
              {footer}
            </View>
          )}
        </SafeAreaView>
      </Animated.View>
    </Animated.View>
  );

  if (superpuesto) return hoja;

  return (
    <Modal visible={visible} animationType="none" transparent={true} onRequestClose={onClose}>
      {hoja}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Cubre toda la pantalla y queda sobre las vistas con elevation (en Android definen el orden de dibujo)
  capa: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    elevation: 100,
  },
  modalContent: {
    width: '90%',
    maxWidth: 600,
    maxHeight: '85%',
    borderRadius: 20,
    overflow: 'hidden',
    flexShrink: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
    paddingRight: 16,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flexShrink: 1,
  },
  scrollContent: {
    padding: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
});
