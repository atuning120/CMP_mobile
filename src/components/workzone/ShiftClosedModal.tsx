import React from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { AlertTriangle, CheckCircle2, CloudUpload } from 'lucide-react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { darkTheme, lightTheme } from '../../constants/theme';
import { styles } from './ShiftClosedModal.styles';

// Datos del turno tomados al momento del cierre (el turno deja de estar disponible en el hook)
export interface ResumenCierreTurno {
  automatico: boolean;
  codigoMaquina: string;
  fechaInicio: string; // ISO 8601
  fechaFin: string; // ISO 8601
  horometroInicial: number;
  horometroFinal: number;
}

interface Props {
  resumen: ResumenCierreTurno | null;
  onClose: () => void;
}

const formatearHora = (iso: string) => new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

const formatearDuracion = (inicio: string, fin: string) => {
  const minutos = Math.max(0, Math.round((new Date(fin).getTime() - new Date(inicio).getTime()) / 60000));
  return `${Math.floor(minutos / 60)} h ${String(minutos % 60).padStart(2, '0')} min`;
};

const formatearHorometro = (valor: number) => valor.toLocaleString('es-CL', { maximumFractionDigits: 1 });

export const ShiftClosedModal: React.FC<Props> = ({ resumen, onClose }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  if (!resumen) return null;

  const colorAcento = resumen.automatico ? theme.warning : theme.success;
  const Icono = resumen.automatico ? AlertTriangle : CheckCircle2;
  const filas = [
    { etiqueta: 'Máquina', valor: resumen.codigoMaquina },
    { etiqueta: 'Horario', valor: `${formatearHora(resumen.fechaInicio)} – ${formatearHora(resumen.fechaFin)}` },
    { etiqueta: 'Duración', valor: formatearDuracion(resumen.fechaInicio, resumen.fechaFin) },
    { etiqueta: 'Horómetro', valor: `${formatearHorometro(resumen.horometroInicial)} → ${formatearHorometro(resumen.horometroFinal)}` },
    { etiqueta: 'Horas registradas', valor: `${formatearHorometro(resumen.horometroFinal - resumen.horometroInicial)} h` },
  ];

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={styles.contenedor} entering={FadeIn.duration(120)}>
        <Pressable style={styles.fondo} onPress={onClose}>
          <Animated.View style={styles.tarjetaAnimada} entering={ZoomIn.duration(150)}>
            <Pressable style={[styles.tarjeta, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.icono, { backgroundColor: colorAcento + '1F' }]}>
                <Icono size={30} color={colorAcento} />
              </View>
              <Text style={[styles.titulo, { color: theme.text }]}>
                {resumen.automatico ? 'Turno cerrado automáticamente' : 'Turno finalizado'}
              </Text>
              <Text style={[styles.mensaje, { color: theme.textSecondary }]}>
                {resumen.automatico
                  ? 'El turno superó las 12 horas y se cerró en el límite. Informa a tu jefe de turno para regularizar el horómetro final.'
                  : 'El cierre quedó registrado correctamente. Buen trabajo.'}
              </Text>

              <View style={[styles.resumen, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
                {filas.map((fila, indice) => (
                  <View
                    key={fila.etiqueta}
                    style={[styles.fila, indice > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}
                  >
                    <Text style={[styles.filaEtiqueta, { color: theme.textSecondary }]}>{fila.etiqueta}</Text>
                    <Text style={[styles.filaValor, { color: theme.text }]}>{fila.valor}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.aviso}>
                <CloudUpload size={14} color={theme.textTertiary} />
                <Text style={[styles.avisoTexto, { color: theme.textTertiary }]}>
                  Se sincronizará con el servidor en segundo plano.
                </Text>
              </View>

              <TouchableOpacity style={[styles.boton, { backgroundColor: theme.primary }]} onPress={onClose}>
                <Text style={styles.botonTexto}>Entendido</Text>
              </TouchableOpacity>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
};
