import React from 'react';
import { Pressable, View, useColorScheme } from 'react-native';
import { Plus } from 'lucide-react-native';
import Animated, { Easing, FadeIn, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { darkTheme, lightTheme } from '../../constants/theme';
import { styles } from './NuevaMaquinaFab.styles';

interface Props {
  onPress: () => void;
  // Extendido muestra la etiqueta; se contrae a círculo mientras el usuario baja por la lista
  expandido: boolean;
}

const PressableAnimado = Animated.createAnimatedComponent(Pressable);
// Curvas sin rebote: desaceleración suave estilo Material
const CURVA = Easing.bezier(0.2, 0, 0, 1);
const TRANSICION = LinearTransition.duration(220).easing(CURVA);
const PRESION = { duration: 120, easing: CURVA };

export const NuevaMaquinaFab: React.FC<Props> = ({ onPress, expandido }) => {
  const theme = useColorScheme() === 'dark' ? darkTheme : lightTheme;
  const escala = useSharedValue(1);
  const estiloEscala = useAnimatedStyle(() => ({ transform: [{ scale: escala.get() }] }));

  return (
    <PressableAnimado
      layout={TRANSICION}
      style={[styles.boton, { backgroundColor: theme.primary }, expandido && styles.botonExtendido, estiloEscala]}
      onPress={onPress}
      onPressIn={() => escala.set(withTiming(0.96, PRESION))}
      onPressOut={() => escala.set(withTiming(1, PRESION))}
      android_ripple={{ color: 'rgba(255,255,255,0.18)', borderless: false }}
      accessibilityRole="button"
      accessibilityLabel="Incorporar nueva máquina"
    >
      <View style={styles.icono}>
        <Plus size={22} color="#FFFFFF" strokeWidth={2.6} />
      </View>
      {expandido && (
        <Animated.Text entering={FadeIn.duration(160)} exiting={FadeOut.duration(100)} style={styles.etiqueta} numberOfLines={1}>
          Nueva máquina
        </Animated.Text>
      )}
    </PressableAnimado>
  );
};
