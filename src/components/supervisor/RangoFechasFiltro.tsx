import React from 'react';
import { Text, TouchableOpacity, useColorScheme } from 'react-native';
import { CalendarRange } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import type { RangoFechasEstado } from '../../hooks/useRangoFechas';
import { etiquetaRango, RANGOS_HISTORIAL } from '../../utils/historialFechas';
import { FleetFilterChips } from './FleetFilterChips';
import { RangoFechasModal } from './RangoFechasModal';
import { styles } from './RangoFechasFiltro.styles';

interface Props {
  estado: RangoFechasEstado;
}

// Chips de rango de fechas, con el resumen del rango personalizado y su modal
export const RangoFechasFiltro: React.FC<Props> = ({ estado }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <>
      <FleetFilterChips filters={RANGOS_HISTORIAL} activeFilter={estado.opcion} onFilterChange={estado.seleccionar} />
      {estado.opcion === 'Personalizado' && (
        <TouchableOpacity style={styles.resumen} onPress={estado.abrirModal} activeOpacity={0.7}>
          <CalendarRange size={14} color={theme.primary} />
          <Text style={[styles.resumenTexto, { color: theme.primary }]}>
            {etiquetaRango(estado.elegido.desde, estado.elegido.hasta)} · Cambiar
          </Text>
        </TouchableOpacity>
      )}
      <RangoFechasModal
        visible={estado.modalVisible}
        desde={estado.elegido.desde}
        hasta={estado.elegido.hasta}
        onClose={estado.cerrarModal}
        onAplicar={estado.aplicar}
      />
    </>
  );
};
