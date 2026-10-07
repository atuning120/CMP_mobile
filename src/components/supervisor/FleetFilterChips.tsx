import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { styles } from './FleetFilterChips.styles';

export type FilterOption = 'Todos' | 'Operativos' | 'Fuera de Servicio';

interface Props<T extends string> {
  activeFilter: T;
  onFilterChange: (filter: T) => void;
  // Por defecto los filtros de la flota; el historial pasa los suyos
  filters?: readonly T[];
}

const FILTERS: FilterOption[] = ['Todos', 'Operativos', 'Fuera de Servicio'];

export function FleetFilterChips<T extends string = FilterOption>({ activeFilter, onFilterChange, filters }: Props<T>) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {(filters ?? (FILTERS as unknown as readonly T[])).map(filter => {
          const isActive = activeFilter === filter;
          
          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.chip,
                isActive 
                  ? { backgroundColor: theme.primary, elevation: 4, shadowColor: theme.primary } 
                  : {
                      backgroundColor: theme.glassSurface,
                      borderColor: theme.glassSurfaceBorder,
                      borderWidth: 1,
                      elevation: colorScheme === 'dark' ? 0 : 1,
                      shadowOpacity: colorScheme === 'dark' ? 0 : 0.1,
                    }
              ]}
              onPress={() => onFilterChange(filter)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.chipText,
                isActive ? { color: '#FFFFFF' } : { color: colorScheme === 'dark' ? theme.textTertiary : theme.textSecondary }
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
