import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { LogOut } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { TurnoActual } from '../../types/turno';
import { ProfileChip } from '../ProfileChip';
import { MachineStatusCard } from './MachineStatusCard';

// Fake operator data for demo, in a real app this comes from auth state
const MOCK_OPERADOR = {
  nombre: 'Cristian',
  apellido: 'Núñez',
  rut: '15.123.456-7'
};

interface Props {
  turno: TurnoActual | null;
  onLogout: () => void;
}

export const TurnoSummaryDropdown: React.FC<Props> = ({ turno, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.chipContainer}>
          <ProfileChip
            nombre={MOCK_OPERADOR.nombre}
            apellido={MOCK_OPERADOR.apellido}
            rut={MOCK_OPERADOR.rut}
            onPress={() => setIsOpen(!isOpen)}
          />
        </View>
        <TouchableOpacity style={[styles.logoutButton, { borderColor: theme.border, backgroundColor: theme.card }]} onPress={onLogout}>
          <LogOut size={20} color={theme.textTertiary} />
        </TouchableOpacity>
      </View>

      {isOpen && turno && (
        <Animated.View 
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          layout={Layout.springify()}
          style={styles.dropdownContent}
        >
          <MachineStatusCard turno={turno} variant="compact" />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipContainer: {
    flex: 1, // Takes up remaining space
  },
  logoutButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContent: {
    marginTop: 8,
  }
});
