import React from 'react';
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { styles } from './SegmentedControl.styles';

interface Opcion<T extends string> {
  valor: T;
  icono?: LucideIcon;
}

interface Props<T extends string> {
  opciones: readonly Opcion<T>[];
  activo: T;
  onChange: (valor: T) => void;
}

// Selector de categoría en una sola barra: se distingue de los chips, que se usan para rangos y estados
export function SegmentedControl<T extends string>({ opciones, activo, onChange }: Props<T>) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <View style={[styles.contenedor, { backgroundColor: theme.glassSurface, borderColor: theme.glassSurfaceBorder }]}>
      {opciones.map(({ valor, icono: Icono }) => {
        const esActivo = valor === activo;
        const color = esActivo ? theme.primary : theme.textSecondary;
        return (
          <TouchableOpacity
            key={valor}
            style={[styles.segmento, esActivo && { backgroundColor: theme.primary + '26', borderColor: theme.primary + '66' }]}
            onPress={() => onChange(valor)}
            activeOpacity={0.7}
          >
            {Icono && <Icono size={15} color={color} />}
            <Text style={[styles.texto, { color }]}>{valor}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
