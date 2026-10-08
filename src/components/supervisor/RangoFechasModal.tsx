import React, { useState } from 'react';
import { Platform, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { CalendarRange } from 'lucide-react-native';
import { AppBottomSheetModal } from '../common/AppBottomSheetModal';
import { darkTheme, lightTheme } from '../../constants/theme';
import { DIAS_MAXIMOS_HISTORIAL, diasIncluidos, inicioDelDia } from '../../utils/historialFechas';
import { styles } from './RangoFechasModal.styles';

interface Props {
  visible: boolean;
  // Rango vigente: el modal parte desde él
  desde: Date;
  hasta: Date;
  onClose: () => void;
  onAplicar: (desde: Date, hasta: Date) => void;
}

const formatear = (fecha: Date) => fecha.toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });

export const RangoFechasModal: React.FC<Props> = ({ visible, desde, hasta, onClose, onAplicar }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const [inicio, setInicio] = useState(desde);
  const [fin, setFin] = useState(hasta);

  // Cada vez que se abre parte desde el rango vigente, no desde lo que se dejó sin aplicar
  const [visibleAntes, setVisibleAntes] = useState(visible);
  if (visible !== visibleAntes) {
    setVisibleAntes(visible);
    if (visible) {
      setInicio(desde);
      setFin(hasta);
    }
  }

  const hoy = inicioDelDia(new Date());
  const dias = diasIncluidos(inicio, fin);
  const error =
    inicio > fin
      ? 'La fecha de inicio debe ser anterior o igual a la de término.'
      : dias > DIAS_MAXIMOS_HISTORIAL
        ? `El rango no puede superar los ${DIAS_MAXIMOS_HISTORIAL} días (son ${dias}).`
        : null;

  // En Android el selector es un diálogo nativo; en iOS se muestra en línea (compacto)
  const abrirAndroid = (valor: Date, onElegir: (fecha: Date) => void) =>
    DateTimePickerAndroid.open({
      value: valor,
      mode: 'date',
      maximumDate: hoy,
      onValueChange: (_evento, fecha) => onElegir(inicioDelDia(fecha)),
    });

  const campo = (etiqueta: string, valor: Date, onElegir: (fecha: Date) => void) => (
    <View style={styles.campo}>
      <Text style={[styles.etiqueta, { color: theme.textSecondary }]}>{etiqueta}</Text>
      {Platform.OS === 'ios' ? (
        <DateTimePicker
          value={valor}
          mode="date"
          display="compact"
          maximumDate={hoy}
          locale="es-CL"
          onValueChange={(_evento, fecha) => onElegir(inicioDelDia(fecha))}
        />
      ) : (
        <TouchableOpacity
          style={[styles.selector, { backgroundColor: theme.cardAlt, borderColor: theme.glassSurfaceBorder }]}
          onPress={() => abrirAndroid(valor, onElegir)}
          activeOpacity={0.7}
        >
          <Text style={[styles.selectorTexto, { color: theme.text }]}>{formatear(valor)}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <AppBottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Rango de fechas"
      subtitle={`Hasta ${DIAS_MAXIMOS_HISTORIAL} días`}
      icon={<CalendarRange size={22} color={theme.primary} />}
      iconBadgeColor={theme.primary + '15'}
      footer={
        <>
          <TouchableOpacity style={[styles.boton, { backgroundColor: theme.cardAlt }]} onPress={onClose}>
            <Text style={[styles.botonTexto, { color: theme.text }]}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.boton, { backgroundColor: theme.primary }, !!error && styles.botonDeshabilitado]}
            disabled={!!error}
            onPress={() => onAplicar(inicio, fin)}
          >
            <Text style={[styles.botonTexto, { color: '#FFFFFF' }]}>Aplicar</Text>
          </TouchableOpacity>
        </>
      }
    >
      {campo('Desde', inicio, setInicio)}
      {campo('Hasta', fin, setFin)}

      {error ? (
        <Text style={[styles.mensaje, { color: theme.danger }]}>{error}</Text>
      ) : (
        <Text style={[styles.mensaje, { color: theme.textSecondary }]}>{dias === 1 ? '1 día' : `${dias} días`}</Text>
      )}
    </AppBottomSheetModal>
  );
};
