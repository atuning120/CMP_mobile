import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { CloudOff, CloudUpload, GitMerge, Hourglass, RefreshCw, Send, Trash2 } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import type { AccionEnBandeja } from '../../services/accionesJefe';
import { HORAS_CONFIRMACION, HORAS_VENCIMIENTO } from '../../sync/vigenciaAcciones';
import { formatearDuracion, formatearFecha } from '../../utils/historialFechas';
import { styles } from './AccionPendienteCard.styles';

interface Props {
  accion: AccionEnBandeja;
  // Hay una decisión en curso sobre esta acción (bloquea sus botones)
  ocupada: boolean;
  onEnviarIgual: (accion: AccionEnBandeja) => void;
  onAplicarSobreActual: (accion: AccionEnBandeja) => void;
  onDescartar: (accion: AccionEnBandeja) => void;
}

const horasDesde = (iso: string) => (Date.now() - new Date(iso).getTime()) / 3_600_000;

/**
 * Una acción hecha sin señal que aún no llega al Backend. Según su estado, el jefe de turno decide:
 * - Más de 24 h: "Enviar igual" o descartarla (pasadas 72 h se descarta sola).
 * - Conflicto (otro jefe cambió la máquina): "Aplicar sobre el estado actual" o descartarla.
 * - Otro rechazo del servidor: reintentarla tal cual o descartarla.
 * - Esperando conexión: solo se puede descartar.
 */
export const AccionPendienteCard: React.FC<Props> = ({ accion, ocupada, onEnviarIgual, onAplicarSobreActual, onDescartar }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const porConfirmar = accion.estado === 'REQUIERE_CONFIRMACION';
  const rechazada = accion.estado === 'ERROR';
  const acento = rechazada ? theme.danger : porConfirmar ? theme.warning : theme.primary;
  const Icono = rechazada ? CloudOff : porConfirmar ? Hourglass : CloudUpload;
  const horas = accion.fechaAccion ? horasDesde(accion.fechaAccion) : null;
  // Las que no son alertas vencen: cuánto le queda antes de descartarse sola
  const restante = horas !== null && accion.tramo !== 'VIGENTE' ? formatearDuracion(Math.max(0, HORAS_VENCIMIENTO - horas) * 60) : null;

  const motivo = rechazada
    ? accion.error
    : porConfirmar
      ? `Se hizo hace más de ${HORAS_CONFIRMACION} h sin conexión y la máquina pudo cambiar desde entonces. ¿La envías igual?${restante ? ` Si no decides, se descarta en ${restante}.` : ''}`
      : accion.enEspera
        ? 'Espera a que se resuelva otra acción detenida de la misma máquina o alerta.'
        : null;

  const boton = (texto: string, icono: React.ReactNode, color: string, relleno: boolean, onPress: () => void) => (
    <TouchableOpacity
      style={[styles.boton, { borderColor: color, backgroundColor: relleno ? color : 'transparent', opacity: ocupada ? 0.5 : 1 }]}
      onPress={onPress}
      disabled={ocupada}
    >
      {icono}
      <Text style={[styles.botonTexto, { color: relleno ? '#FFFFFF' : color }]}>{texto}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.card, { backgroundColor: theme.glassSurface, borderColor: acento + '66' }]}>
      <View style={styles.cabecera}>
        <View style={[styles.icono, { backgroundColor: acento + '1F' }]}>
          <Icono size={18} color={acento} />
        </View>
        <View style={styles.textos}>
          <Text style={[styles.descripcion, { color: theme.text }]}>{accion.descripcion}</Text>
          {accion.fechaAccion && (
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              Hecha {formatearFecha(accion.fechaAccion)}
              {horas !== null && horas >= 1 ? ` · hace ${formatearDuracion(horas * 60)}` : ''}
            </Text>
          )}
        </View>
        {ocupada && <ActivityIndicator color={acento} />}
      </View>

      {!!motivo && (
        <Text style={[styles.motivo, { color: rechazada ? theme.dangerText : theme.text, backgroundColor: acento + '14' }]}>{motivo}</Text>
      )}

      <View style={styles.botones}>
        {porConfirmar && boton('Enviar igual', <Send size={15} color="#FFFFFF" />, theme.warning, true, () => onEnviarIgual(accion))}
        {rechazada &&
          accion.esConflicto &&
          boton('Aplicar sobre el estado actual', <GitMerge size={15} color="#FFFFFF" />, theme.primary, true, () => onAplicarSobreActual(accion))}
        {rechazada &&
          !accion.esConflicto &&
          boton('Reintentar', <RefreshCw size={15} color="#FFFFFF" />, theme.primary, true, () => onEnviarIgual(accion))}
        {boton('Descartar', <Trash2 size={15} color={theme.danger} />, theme.danger, false, () => onDescartar(accion))}
      </View>
    </View>
  );
};
