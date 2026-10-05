import React, { useState, useCallback } from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { TurnoActual } from '../../types/turno';
import { darkTheme, lightTheme } from '../../constants/theme';
import { useFocusEffect } from 'expo-router';
import { styles } from './MachineStatusCard.styles';

interface Props {
  turno: TurnoActual;
  variant?: 'default' | 'compact';
}

export const MachineStatusCard: React.FC<Props> = ({ turno, variant = 'default' }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const [duracion, setDuracion] = useState('0h 0m');

  useFocusEffect(
    useCallback(() => {
      const updateDuration = () => {
        // Sin estado operacional registrado se muestra la duración del turno completo
        const start = new Date(turno.estadoOperacionalActual?.inicio ?? turno.fechaInicio).getTime();
        const now = Date.now();
        const diffMs = now - start;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setDuracion(`${diffHrs}h ${diffMins}m`);
      };

      updateDuration();
      const intervalId = setInterval(updateDuration, 60000);

      return () => clearInterval(intervalId);
    }, [turno.estadoOperacionalActual?.inicio, turno.fechaInicio])
  );

  const isCompact = variant === 'compact';

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, isCompact && styles.cardCompact]}>
      <View style={[styles.topSection, isCompact && styles.topSectionCompact]}>
        <View style={[styles.badge, isCompact && styles.badgeCompact, { backgroundColor: theme.primary }]}>
          <Text style={[styles.badgeText, isCompact && styles.badgeTextCompact]}>{turno.maquina.codigoCorto}</Text>
        </View>
        <View style={styles.machineInfo}>
          <Text
            style={[styles.machineName, isCompact && styles.machineNameCompact, { color: theme.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {turno.maquina.nombreCompleto}
          </Text>
          <Text style={[styles.secondaryText, isCompact && styles.secondaryTextCompact, { color: theme.textSecondary }]}>
            Área: {turno.area?.nombre ?? 'Sin asignar'} · Horóm. Inicial: <Text style={{ color: theme.warning, fontWeight: 'bold' }}>{turno.horometroInicial}h</Text>
          </Text>
        </View>
        <View style={[styles.statusPill, isCompact && styles.statusPillCompact, { backgroundColor: theme.success + '20', borderColor: theme.success }]}>
          <Text style={[styles.statusPillText, isCompact && styles.statusPillTextCompact, { color: theme.success }]}>En Operación</Text>
        </View>
      </View>
      <View style={[styles.divider, isCompact && styles.dividerCompact, { backgroundColor: theme.border }]} />
      <View style={styles.bottomSection}>
        <View style={styles.stateBlock}>
          <Text style={[styles.label, { color: theme.textTertiary }]}>ESTADO OPERACIONAL ACTUAL</Text>
          <View style={styles.stateValueContainer}>
            <View style={[styles.dot, isCompact && styles.dotCompact, { backgroundColor: theme.success }]} />
            <Text style={[styles.stateName, isCompact && styles.stateNameCompact, { color: theme.warning }]}>{turno.estadoOperacionalActual?.estado.nombre ?? 'Sin registrar'}</Text>
          </View>
        </View>
        <View style={styles.durationBlock}>
          <Text style={[styles.label, { color: theme.textTertiary }]}>DURACIÓN</Text>
          <Text style={[styles.durationValue, isCompact && styles.durationValueCompact, { color: theme.warning }]}>{duracion}</Text>
        </View>
      </View>
    </View>
  );
};
