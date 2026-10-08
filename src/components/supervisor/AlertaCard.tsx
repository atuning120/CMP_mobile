import React from 'react';
import { Text, View, useColorScheme } from 'react-native';
import { AlarmClockOff, AlertTriangle, Clock, MapPin, Timer } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import type { Alerta } from '../../services/alertasService';
import { formatearDuracion, formatearFecha } from '../../utils/historialFechas';
import { styles } from './HistorialEventoCard.styles';

interface Props {
  alerta: Alerta;
}

const minutosEntre = (desde: string, hasta: string | null) =>
  ((hasta ? new Date(hasta).getTime() : Date.now()) - new Date(desde).getTime()) / 60000;

// Misma tarjeta que el historial: icono, quién y qué máquina, una etiqueta con el estado y los datos del turno
export const AlertaCard: React.FC<Props> = ({ alerta }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const { turno } = alerta;
  const esCierreAutomatico = alerta.tipo === 'CIERRE_AUTOMATICO';
  // Turno extendido que sigue abierto: es la única alerta que todavía requiere acción
  const activa = !esCierreAutomatico && turno.estado === 'EN_CURSO';
  const acento = esCierreAutomatico ? theme.danger : theme.warning;
  const Icono = esCierreAutomatico ? AlarmClockOff : AlertTriangle;
  const duracion = formatearDuracion(minutosEntre(turno.horaInicio, turno.horaTermino));
  const ubicacion = [alerta.area, alerta.zona].filter(Boolean).join(' · ');

  const etiqueta = esCierreAutomatico
    ? 'Cierre automático a las 12 h · posible olvido de cierre'
    : activa
      ? `Turno abierto hace ${duracion}`
      : `Turno de ${duracion}${turno.estado === 'CERRADO_AUTO' ? ' · se cerró automáticamente' : ''}`;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.glassSurface, borderColor: activa ? acento + '80' : theme.glassSurfaceBorder },
        colorScheme === 'dark' && styles.sinSombra,
      ]}
    >
      <View style={[styles.icono, { backgroundColor: acento + '1F' }]}>
        <Icono size={18} color={acento} />
      </View>

      <View style={styles.cuerpo}>
        <Text style={[styles.titulo, { color: theme.text }]}>
          {esCierreAutomatico ? (
            <>
              Se cerró automáticamente el turno de <Text style={styles.actor}>{alerta.operador}</Text> en{' '}
            </>
          ) : (
            <>
              <Text style={styles.actor}>{alerta.operador}</Text> {activa ? 'lleva más de 10 h' : 'superó las 10 h'} de turno en{' '}
            </>
          )}
          <Text style={[styles.maquina, { color: acento }]}>{alerta.maquina.nombre}</Text>
        </Text>

        <View style={[styles.motivo, styles.motivoConIcono, { backgroundColor: acento + '14', borderColor: acento + '40' }]}>
          <Timer size={12} color={acento} />
          <Text style={[styles.motivoTexto, { color: acento }]}>{activa ? `Activa · ${etiqueta}` : etiqueta}</Text>
        </View>

        <View style={styles.metaFila}>
          {!!ubicacion && (
            <View style={styles.metaItem}>
              <MapPin size={12} color={theme.textTertiary} />
              <Text style={[styles.metaTexto, { color: theme.textSecondary }]} numberOfLines={1}>{ubicacion}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Clock size={12} color={theme.textTertiary} />
            <Text style={[styles.metaTexto, { color: theme.textSecondary }]}>Inicio {formatearFecha(turno.horaInicio)}</Text>
          </View>
        </View>

        <Text style={[styles.fecha, { color: theme.textTertiary }]}>{formatearFecha(alerta.fecha)}</Text>
      </View>
    </View>
  );
};
