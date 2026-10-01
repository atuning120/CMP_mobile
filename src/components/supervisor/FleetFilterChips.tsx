import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { styles } from './FleetFilterChips.styles';

export type FilterOption = 'Todos' | 'Operativos' | 'Fuera de Servicio';

interface Props {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
}

const FILTERS: FilterOption[] = ['Todos', 'Operativos', 'Fuera de Servicio'];

export const FleetFilterChips: React.FC<Props> = ({ activeFilter, onFilterChange }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {FILTERS.map(filter => {
          const isActive = activeFilter === filter;
          
          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.chip,
                isActive 
                  ? { backgroundColor: theme.primary, elevation: 4, shadowColor: theme.primary } 
                  : { backgroundColor: theme.card, elevation: 1, borderColor: theme.border, borderWidth: 1 }
              ]}
              onPress={() => onFilterChange(filter)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.chipText,
                isActive ? { color: '#FFFFFF' } : { color: theme.textSecondary }
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

