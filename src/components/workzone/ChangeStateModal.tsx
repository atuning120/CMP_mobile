import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Play, Truck, Coffee, Clock, Wrench } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { AppBottomSheetModal } from '../common/AppBottomSheetModal';
import { EstadoOperacional, TurnoEstadoActual } from '../../types/turno';

interface ChangeStateModalProps {
  visible: boolean;
  onClose: () => void;
  estadosCatalogo: EstadoOperacional[];
  estadoActual: TurnoEstadoActual | null;
  onStateChange: (estado: EstadoOperacional) => void;
}

const getStateConfig = (nombre: string, theme: any) => {
  const normalized = nombre.toLowerCase();
  if (normalized.includes('producción')) {
    return { title: 'OPERANDO EN PRODUCCIÓN', sub: 'Carguío, empuje o...', icon: Play, color: theme.success };
  } else if (normalized.includes('traslado')) {
    return { title: 'TRASLADO ENTRE ÁREAS', sub: 'Tránsito de maquinaria en...', icon: Truck, color: theme.primary };
  } else if (normalized.includes('colación')) {
    return { title: 'COLACIÓN / DESCANSO', sub: 'Pausa de colación...', icon: Coffee, color: theme.warning };
  } else if (normalized.includes('espera')) {
    return { title: 'ESPERA OPERACIONAL', sub: 'Espera de tolva, tren, o...', icon: Clock, color: theme.warning };
  } else if (normalized.includes('falla')) {
    return { title: 'FALLA MECÁNICA / PANA', sub: 'Detención por avería o...', icon: Wrench, color: theme.danger };
  } else {
    // Default
    return { title: nombre.toUpperCase(), sub: 'Registro manual...', icon: Clock, color: theme.textSecondary };
  }
};

export const ChangeStateModal: React.FC<ChangeStateModalProps> = ({
  visible,
  onClose,
  estadosCatalogo,
  estadoActual,
  onStateChange
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  useEffect(() => {
    if (!visible || !estadoActual) return;
    
    const updateTimer = () => {
      const now = new Date();
      const start = new Date(estadoActual.inicio);
      const diffInSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
      
      const hours = Math.floor(diffInSeconds / 3600);
      const minutes = Math.floor((diffInSeconds % 3600) / 60);
      const seconds = diffInSeconds % 60;
      
      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [visible, estadoActual]);

  const headerTop = (
    <Text style={[styles.headerTag, { color: theme.primary }]}>
      CONTROL TÁCTIL DE CABINA · FAENA MINERA
    </Text>
  );

  return (
    <AppBottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Cambiar Estado Operacional"
      subtitle="Presiona el estado correspondiente para auditar las horas efectivas sin ambigüedad."
      headerTop={headerTop}
      scrollContentStyle={{ padding: 16 }}
    >
      <View style={[styles.timerContainer, { borderColor: theme.border, backgroundColor: theme.background }]}>
        <Text style={[styles.timerLabel, { color: theme.textSecondary }]}>
          TIEMPO EN ESTADO ACTUAL
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
          <Clock size={14} color={theme.warning} />
          <Text style={[styles.timerValue, { color: theme.warning }]}>{elapsedTime}</Text>
        </View>
      </View>

      <View style={styles.gridContainer}>
        {estadosCatalogo.map((estado) => {
          const config = getStateConfig(estado.nombre, theme);
          const Icon = config.icon;
          const isActive = estadoActual?.estado.id === estado.id;
          const activeColor = config.color;
          
          return (
            <TouchableOpacity
              key={estado.id}
              style={[
                styles.stateCard,
                { backgroundColor: theme.cardAlt, borderColor: isActive ? activeColor : theme.border },
                isActive && { borderWidth: 2 }
              ]}
              onPress={() => onStateChange(estado)}
              disabled={isActive}
            >
              <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
                <Icon size={24} color={isActive ? activeColor : theme.textSecondary} />
              </View>
              
              <View style={{ flex: 1, paddingLeft: 12 }}>
                <Text style={[styles.stateTitle, { color: isActive ? activeColor : theme.text }]}>
                  {config.title}
                </Text>
                <Text style={[styles.stateSub, { color: theme.textSecondary }]}>
                  {config.sub}
                </Text>
              </View>

              {isActive && (
                <View style={[styles.activeBadge, { backgroundColor: activeColor + '20' }]}>
                  <Text style={[styles.activeBadgeText, { color: activeColor }]}>ACTIVO</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </AppBottomSheetModal>
  );
};

const styles = StyleSheet.create({
  headerTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  timerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  stateCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    minHeight: 110,
    position: 'relative',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stateTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    marginLeft: -12,
  },
  stateSub: {
    fontSize: 10,
    marginLeft: -12,
  },
  activeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  }
});
