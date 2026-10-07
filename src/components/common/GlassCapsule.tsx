import React from 'react';
import { StyleProp, View, ViewStyle, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { darkTheme, lightTheme } from '../../constants/theme';
import { styles } from './GlassCapsule.styles';

interface Props {
  children: React.ReactNode;
  // Android solo difumina lo que está dentro de un BlurTargetView: se pasa la referencia al fondo de la pantalla
  blurTarget?: React.RefObject<View | null>;
  style?: StyleProp<ViewStyle>;
}

// Cápsula translúcida con desenfoque del fondo (efecto vidrio esmerilado)
export const GlassCapsule: React.FC<Props> = ({ children, blurTarget, style }) => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <BlurView
      // En Android el tint no se actualiza en caliente: al cambiar de tema se vuelve a crear la vista
      key={isDark ? 'oscuro' : 'claro'}
      intensity={isDark ? 40 : 35}
      tint={isDark ? 'dark' : 'light'}
      blurTarget={blurTarget}
      // RenderNode en Android 12+; en versiones anteriores no difumina para no penalizar el rendimiento
      blurMethod="dimezisBlurViewSdk31Plus"
      style={[styles.capsula, { borderColor: theme.glassBorder }, style]}
    >
      {/* El color va en una capa propia: en Android el backgroundColor del BlurView queda bajo el desenfoque */}
      <View pointerEvents="none" style={[styles.velo, { backgroundColor: theme.glassOverlay }]} />
      {children}
    </BlurView>
  );
};
