import React from 'react';
import { View, TextInput, useColorScheme } from 'react-native';
import { Search } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { styles } from './FleetSearchBar.styles';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
}

export const FleetSearchBar: React.FC<Props> = ({ value, onChangeText }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.glassSurface, borderColor: theme.glassSurfaceBorder },
        // La sombra de Android se ve sucia sobre el vidrio oscuro
        colorScheme === 'dark' && styles.sinSombra,
      ]}
    >
      <Search size={20} color={theme.textTertiary} style={styles.icon} />
      <TextInput
        style={[styles.input, { color: theme.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder="Buscar por código, patente, marca o modelo..."
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        placeholderTextColor={theme.textTertiary}
      />
    </View>
  );
};

