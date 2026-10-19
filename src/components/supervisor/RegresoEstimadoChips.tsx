import React from 'react';
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Clock } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { styles } from './RegresoEstimadoChips.styles';

// Plazos típicos en faena: una reparación corta, un día, una reparación mayor (40 h), unos días o una semana.
// Botones en vez de un calendario: en terreno se eligen más rápido y con guantes
const PLAZOS: { horas: number; etiqueta: string }[] = [
  { horas: 8, etiqueta: '8 h' },
  { horas: 24, etiqueta: '24 h' },
  { horas: 40, etiqueta: '40 h' },
  { horas: 72, etiqueta: '3 días' },
  { horas: 168, etiqueta: '1 semana' },
];

const formatoFecha = new Intl.DateTimeFormat('es-CL', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

interface Props {
  // Horas desde ahora; null = sin fecha estimada
  horas: number | null;
  onChange: (horas: number | null) => void;
  codigo: string;
  disabled?: boolean;
}

/** Cuándo se espera que vuelva a operar una máquina en mantenimiento o fuera de servicio (opcional). */
export const RegresoEstimadoChips: React.FC<Props> = ({ horas, onChange, codigo, disabled }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <View style={styles.contenedor}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>REGRESO ESTIMADO (OPCIONAL)</Text>
      <View style={styles.chips}>
        {[{ horas: null, etiqueta: 'Sin fecha' }, ...PLAZOS].map((plazo) => {
          const elegido = plazo.horas === horas;
          return (
            <TouchableOpacity
              key={plazo.etiqueta}
              style={[
                styles.chip,
                { borderColor: elegido ? theme.primary : theme.border, backgroundColor: elegido ? theme.primary + '1F' : theme.background },
              ]}
              onPress={() => onChange(plazo.horas)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityState={{ selected: elegido }}
            >
              <Text style={[styles.chipTexto, { color: elegido ? theme.primaryText : theme.text }]}>
                {plazo.horas === null ? plazo.etiqueta : `En ${plazo.etiqueta}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.resumen}>
        <Clock size={13} color={theme.textTertiary} />
        <Text style={[styles.resumenTexto, { color: theme.textSecondary }]}>
          {horas === null
            ? `Sin fecha: ${codigo} queda fuera de operación hasta que la devuelvas.`
            : `Vuelve el ${formatoFecha.format(regresoDesdeAhora(horas))}. Si se cumple y no vuelve, la flota lo marca.`}
        </Text>
      </View>
    </View>
  );
};

// Horas desde ahora -> fecha; se calcula al enviar para que no quede en el pasado si el formulario estuvo abierto
export const regresoDesdeAhora = (horas: number) => new Date(Date.now() + horas * 60 * 60 * 1000);
