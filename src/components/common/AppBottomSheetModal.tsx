import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, useColorScheme, Platform, KeyboardAvoidingView, StyleProp, ViewStyle } from 'react-native';
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
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollContentStyle?: StyleProp<ViewStyle>;
  modalStyle?: StyleProp<ViewStyle>;
}

export const AppBottomSheetModal: React.FC<AppBottomSheetModalProps> = ({
  visible,
  onClose,
  title,
  icon,
  iconBadgeColor,
  headerTop,
  subtitle,
  children,
  footer,
  scrollContentStyle,
  modalStyle,
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <Modal visible={visible} animationType="none" transparent={true} onRequestClose={onClose}>
      <Animated.View
        style={styles.modalOverlay}
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
      >
        <Animated.View
          entering={SlideInDown.springify().damping(28).stiffness(250).mass(0.8)}
          exiting={SlideOutDown.duration(200)}
          style={{ flexShrink: 1, width: '100%', alignItems: 'center' }}
        >
          <SafeAreaView style={[styles.modalContent, { backgroundColor: theme.card }, modalStyle]} edges={['top', 'bottom']}>
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
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.cardAlt }]}>
                <X size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flexShrink: 1 }}>
              <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, scrollContentStyle]} showsVerticalScrollIndicator={true}>
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
