import React from 'react';
import { Text, TextInput, View, useColorScheme } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { MaquinaFlota } from '../../hooks/useFlotaResumen';
import { styles } from './CierreTurnoCampos.styles';

interface Props {
  maquina: MaquinaFlota;
  horometro: string;
  onChange: (horometro: string) => void;
  disabled?: boolean;
}

// Horómetro escrito con coma o punto decimal; null si no es un número
export const leerHorometro = (texto: string): number | null => {
  const valor = Number(texto.replace(',', '.'));
  return texto.trim() !== '' && Number.isFinite(valor) ? valor : null;
};

/**
 * La máquina tiene un turno en curso: para sacarla de operación, el jefe de turno lo cierra en nombre del operador
 * con el horómetro final que le dicta por radio. El cierre usa el mismo motivo de la acción.
 */
export const CierreTurnoCampos: React.FC<Props> = ({ maquina, horometro, onChange, disabled }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const valor = leerHorometro(horometro);
  const menor = valor !== null && valor < maquina.horometroActual;

  return (
    <View style={[styles.caja, { backgroundColor: theme.warning + '14', borderColor: theme.warning + '80' }]}>
      <View style={styles.fila}>
        <AlertTriangle size={18} color={theme.warning} style={styles.icono} />
        <Text style={[styles.texto, { color: theme.text }]}>
          <Text style={styles.negrita}>{maquina.codigo}</Text> tiene un turno en curso de{' '}
          <Text style={styles.negrita}>{maquina.operadorEnTurno}</Text>
          {maquina.zonaActual ? ` en ${maquina.zonaActual}` : ''}. Para continuar se cerrará ese turno: pídele al operador
          el horómetro final por radio.
        </Text>
      </View>
      <Text style={[styles.label, { color: theme.textSecondary }]}>HORÓMETRO FINAL DEL TURNO (H) *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: menor ? theme.danger : theme.border }]}
        value={horometro}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder={maquina.horometroActual.toLocaleString('es-CL', { minimumFractionDigits: 1 })}
        placeholderTextColor={theme.textTertiary}
        editable={!disabled}
        accessibilityLabel="Horómetro final del turno"
      />
      <Text style={[styles.ayuda, { color: menor ? theme.dangerText : theme.textSecondary }]}>
        {menor
          ? 'No puede ser menor que el horómetro con que se inició el turno.'
          : `Al iniciar el turno marcaba ${maquina.horometroActual.toLocaleString('es-CL', { minimumFractionDigits: 1 })} h.`}
      </Text>
    </View>
  );
};
