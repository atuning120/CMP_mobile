import React, { useEffect, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { AlertCircle, Check, Info } from 'lucide-react-native';
import Animated, {
  Easing,
  FadeInUp,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { darkTheme, lightTheme } from '../../constants/theme';
import { Aviso, suscribirAvisos } from '../../services/retroalimentacion';
import { styles } from './AvisoFlotante.styles';

// Tiempo en pantalla: suficiente para leerlo de reojo sin tapar la pantalla mucho rato
const DURACION_MS = 2800;

/**
 * Aviso breve que confirma una acción ("Turno iniciado", "Estado: …"). Cápsula de superficie invertida
 * con el ícono en un círculo de color y una línea que se vacía mientras queda visible. Se monta una vez
 * en el layout raíz, sobre todas las pantallas; se cierra solo o al tocarlo.
 */
export const AvisoFlotante: React.FC = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const progreso = useSharedValue(1);

  useEffect(() => suscribirAvisos(setAviso), []);

  // Cada aviso nuevo reemplaza al anterior y reinicia el tiempo (y la línea de progreso)
  useEffect(() => {
    if (!aviso) return;
    progreso.value = 1;
    progreso.value = withTiming(0, { duration: DURACION_MS, easing: Easing.linear });
    const timer = setTimeout(() => setAviso(null), DURACION_MS);
    return () => clearTimeout(timer);
  }, [aviso, progreso]);

  const estiloProgreso = useAnimatedStyle(() => ({ transform: [{ scaleX: progreso.value }] }));

  if (!aviso) return null;

  const color = aviso.tipo === 'exito' ? theme.success : aviso.tipo === 'error' ? theme.danger : theme.primary;
  const Icono = aviso.tipo === 'exito' ? Check : aviso.tipo === 'error' ? AlertCircle : Info;

  return (
    <View style={[styles.contenedor, { top: insets.top + 10 }]} pointerEvents="box-none">
      <Animated.View
        key={aviso.id}
        // Entrada lineal y corta, sin rebote: menos cuadros que calcular en teléfonos de gama baja
        entering={FadeInUp.duration(180)}
        exiting={FadeOutUp.duration(160)}
        style={styles.animado}
      >
        <Pressable
          onPress={() => setAviso(null)}
          style={[styles.capsula, { backgroundColor: theme.inverseSurface }]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          accessibilityHint="Toca para cerrar"
        >
          <View style={styles.fila}>
            <View style={[styles.circulo, { backgroundColor: color }]}>
              <Icono size={16} color="#FFFFFF" strokeWidth={3} />
            </View>
            <View style={styles.textos}>
              <Text style={[styles.mensaje, { color: theme.inverseText }]} numberOfLines={2}>
                {aviso.mensaje}
              </Text>
              {!!aviso.detalle && (
                <Text style={[styles.detalle, { color: theme.inverseTextSecondary }]} numberOfLines={2}>
                  {aviso.detalle}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.pista}>
            <Animated.View style={[styles.progreso, { backgroundColor: color }, estiloProgreso]} />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};
