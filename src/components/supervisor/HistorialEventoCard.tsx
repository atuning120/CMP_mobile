import React from 'react';
import { Text, View, useColorScheme } from 'react-native';
import { AlarmClockOff, Ban, CheckCircle, Clock, Edit2, MapPin, Play, PlusCircle, RefreshCw, Square, LucideIcon } from 'lucide-react-native';
import { darkTheme, lightTheme, ThemeColors } from '../../constants/theme';
import type { EventoHistorial, TipoEventoHistorial } from '../../services/historialService';
import { styles } from './HistorialEventoCard.styles';
import { formatearFecha } from '../../utils/historialFechas';

interface Props {
  evento: EventoHistorial;
}

const PRESENTACION: Record<TipoEventoHistorial, { icono: LucideIcon; verbo: string; color: (t: ThemeColors) => string }> = {
  INICIO_TURNO: { icono: Play, verbo: 'inició turno en', color: (t) => t.success },
  INCORPORAR: { icono: PlusCircle, verbo: 'incorporó', color: (t) => t.primary },
  EDITAR: { icono: Edit2, verbo: 'editó', color: (t) => t.warning },
  HABILITAR: { icono: CheckCircle, verbo: 'habilitó', color: (t) => t.success },
  DESHABILITAR: { icono: Ban, verbo: 'deshabilitó', color: (t) => t.danger },
  REEMPLAZAR: { icono: RefreshCw, verbo: 'reemplazó', color: (t) => t.warning },
};

const texto = (valor: unknown) => (typeof valor === 'string' && valor.trim() !== '' ? valor : null);

// null/undefined no deben leerse como 0 (Number(null) === 0)
const numero = (valor: unknown) => {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
};

export const HistorialEventoCard: React.FC<Props> = ({ evento }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const presentacion = PRESENTACION[evento.tipo];
  // Un tipo que esta versión de la app no conoce (Backend más nuevo) no debe romper la lista
  if (!presentacion) return null;
  const esTurno = evento.tipo === 'INICIO_TURNO';
  // Un turno ya cerrado se marca en rojo en la misma tarjeta de su inicio
  const horaTermino = esTurno ? texto(evento.detalle?.horaTermino) : null;
  const Icono = horaTermino ? Square : presentacion.icono;
  const acento = horaTermino ? theme.danger : presentacion.color(theme);
  const verbo = presentacion.verbo;
  // El sistema lo cerró al pasar las 12 h (probablemente el operador olvidó finalizarlo)
  const cierreAutomatico = esTurno && evento.detalle?.estadoTurno === 'CERRADO_AUTO';

  // Inicio de turno: dónde y con qué horómetro partió
  const ubicacion = [texto(evento.detalle?.area), texto(evento.detalle?.zona)].filter(Boolean).join(' · ');
  const horometro = numero(evento.detalle?.horometroInicial);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.glassSurface, borderColor: theme.glassSurfaceBorder },
        colorScheme === 'dark' && styles.sinSombra,
      ]}
    >
      <View style={[styles.icono, { backgroundColor: acento + '1F' }]}>
        <Icono size={18} color={acento} />
      </View>

      <View style={styles.cuerpo}>
        <Text style={[styles.titulo, { color: theme.text }]}>
          <Text style={styles.actor}>{evento.actor}</Text> {verbo} <Text style={[styles.maquina, { color: acento }]}>{evento.maquina.nombre}</Text>
        </Text>

        {!!evento.motivo && (
          <View style={[styles.motivo, { backgroundColor: acento + '14', borderColor: acento + '40' }]}>
            <Text style={[styles.motivoTexto, { color: acento }]}>{evento.motivo}</Text>
          </View>
        )}
        {cierreAutomatico && (
          <View style={[styles.motivo, styles.motivoConIcono, { backgroundColor: theme.warning + '14', borderColor: theme.warning + '40' }]}>
            <AlarmClockOff size={12} color={theme.warning} />
            <Text style={[styles.motivoTexto, { color: theme.warning }]}>Cierre automático (más de 12 h)</Text>
          </View>
        )}
        {!!evento.observacion && <Text style={[styles.observacion, { color: theme.textSecondary }]}>{evento.observacion}</Text>}

        {esTurno && (
          <View style={styles.metaFila}>
            {!!ubicacion && (
              <View style={styles.metaItem}>
                <MapPin size={12} color={theme.textTertiary} />
                <Text style={[styles.metaTexto, { color: theme.textSecondary }]} numberOfLines={1}>{ubicacion}</Text>
              </View>
            )}
            {horometro !== null && (
              <View style={styles.metaItem}>
                <Clock size={12} color={theme.textTertiary} />
                <Text style={[styles.metaTexto, { color: theme.textSecondary }]}>
                  {horometro.toLocaleString('es-CL', { maximumFractionDigits: 1 })} hrs
                </Text>
              </View>
            )}
          </View>
        )}

        {horaTermino ? (
          <Text style={[styles.fecha, { color: theme.textTertiary }]}>
            Inicio {formatearFecha(evento.fecha)} · Fin {formatearFecha(horaTermino)}
          </Text>
        ) : (
          <Text style={[styles.fecha, { color: theme.textTertiary }]}>{formatearFecha(evento.fecha)}</Text>
        )}
      </View>
    </View>
  );
};
