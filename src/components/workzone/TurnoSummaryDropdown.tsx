import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { LogOut } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { TurnoActual } from '../../types/turno';
import { ProfileChip } from '../ProfileChip';
import { MachineStatusCard } from './MachineStatusCard';
import { useOperadorActual } from '../../hooks/useOperadorActual';

interface Props {
  turno: TurnoActual | null;
  onLogout: () => void;
}

export const TurnoSummaryDropdown: React.FC<Props> = ({ turno, onLogout }) => {
  const [isOpen, setIsOpen] = useState(true);
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  // Usuario real que inició sesión (operador o jefe de turno), guardado en el teléfono
  const perfil = useOperadorActual();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.chipContainer}>
          <ProfileChip
            nombre={perfil?.nombre ?? ''}
            apellido={perfil?.apellido ?? ''}
            rut={perfil?.detalle ?? ''}
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
