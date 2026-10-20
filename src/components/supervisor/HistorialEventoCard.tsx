import React from 'react';
import { Text, View, useColorScheme } from 'react-native';
import {
  Activity,
  AlarmClockOff,
  ArrowLeftRight,
  Ban,
  CheckCircle,
  Clock,
  Edit2,
  MapPin,
  Play,
  PlusCircle,
  RefreshCw,
  Square,
  Undo2,
  UserCheck,
  LucideIcon,
} from 'lucide-react-native';
import { darkTheme, lightTheme, ThemeColors } from '../../constants/theme';
import type { EventoHistorial, TipoEventoHistorial } from '../../services/historialService';
import { styles } from './HistorialEventoCard.styles';
import { formatearFecha } from '../../utils/historialFechas';
import { presentacionEstado } from '../../constants/estadosMaquina';

interface Props {
  evento: EventoHistorial;
}

const PRESENTACION: Record<TipoEventoHistorial, { icono: LucideIcon; verbo: string; color: (t: ThemeColors) => string }> = {
  INICIO_TURNO: { icono: Play, verbo: 'inició turno en', color: (t) => t.success },
  FIN_TURNO: { icono: Square, verbo: 'cerró turno en', color: (t) => t.danger },
  CAMBIO_UBICACION: { icono: ArrowLeftRight, verbo: 'trasladó', color: (t) => t.primary },
  INCORPORAR: { icono: PlusCircle, verbo: 'incorporó', color: (t) => t.primary },
  EDITAR: { icono: Edit2, verbo: 'editó', color: (t) => t.warning },
  HABILITAR: { icono: CheckCircle, verbo: 'habilitó', color: (t) => t.success },
  DESHABILITAR: { icono: Ban, verbo: 'deshabilitó', color: (t) => t.danger },
  CAMBIAR_ESTADO: { icono: Activity, verbo: 'cambió el estado de', color: (t) => t.primary },
  REEMPLAZAR: { icono: RefreshCw, verbo: 'reemplazó', color: (t) => t.warning },
  DEVOLVER: { icono: Undo2, verbo: 'devolvió a operación', color: (t) => t.success },
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
  // El inicio y el cierre del turno son eventos separados, cada uno en su fecha
  const esTurno = evento.tipo === 'INICIO_TURNO' || evento.tipo === 'FIN_TURNO';
  const esCierre = evento.tipo === 'FIN_TURNO';
  const Icono = presentacion.icono;
  const acento = presentacion.color(theme);
  const verbo = presentacion.verbo;
  const reemplazadaPor = evento.tipo === 'REEMPLAZAR' ? texto(evento.detalle?.entrante) : null;
  // Cambio de estado: a cuál pasó (los registros antiguos de habilitar/deshabilitar no lo traen)
  const despues = evento.detalle?.despues as { estado?: unknown } | undefined;
  const estadoNuevo = evento.tipo === 'CAMBIAR_ESTADO' || evento.tipo === 'HABILITAR' ? texto(despues?.estado) : null;
  // Reemplazo: cómo quedó la saliente (los registros antiguos no lo traen). Devolución: el respaldo que sale
  const estadoSaliente = evento.tipo === 'REEMPLAZAR' ? texto(despues?.estado) : null;
  const respaldoDevuelto = evento.tipo === 'DEVOLVER' ? texto(evento.detalle?.respaldo) : null;
  // Turno cerrado por un jefe de turno en nombre del operador (falla de la máquina, mantención)
  const cerradoPor = esCierre ? texto(evento.detalle?.cerradoPor) : null;
  const motivoCierre = esCierre ? texto(evento.detalle?.motivoCierre) : null;
  // El sistema lo cerró al pasar la duración máxima (probablemente el operador olvidó finalizarlo).
  // Sin número de horas: los turnos antiguos se cerraban a las 12 h y los actuales a las 13 h
  const cierreAutomatico = esCierre && evento.detalle?.estadoTurno === 'CERRADO_AUTO';

  // Inicio: dónde y con qué horómetro partió. Cierre: dónde terminó y cuánto avanzó el horómetro.
  // Cambio de área/zona: desde dónde y a dónde fue
  const ubicacion = [texto(evento.detalle?.area), texto(evento.detalle?.zona)].filter(Boolean).join(' · ');
  const horometroInicial = numero(evento.detalle?.horometroInicial);
  const horometroFinal = esCierre ? numero(evento.detalle?.horometroFinal) : null;
  const formatoHoras = (valor: number) => valor.toLocaleString('es-CL', { maximumFractionDigits: 1 });
  const horometro = esCierre
    ? horometroFinal !== null
      ? `${horometroInicial !== null ? `${formatoHoras(horometroInicial)} → ` : ''}${formatoHoras(horometroFinal)} hrs`
      : 'Sin horómetro final'
    : horometroInicial !== null
      ? `${formatoHoras(horometroInicial)} hrs`
      : null;
  const esCambioUbicacion = evento.tipo === 'CAMBIO_UBICACION';
  const ubicacionAnterior = esCambioUbicacion
    ? [texto(evento.detalle?.areaAnterior), texto(evento.detalle?.zonaAnterior)].filter(Boolean).join(' · ')
    : '';
  const traslado = esCambioUbicacion ? [ubicacionAnterior, ubicacion].filter(Boolean).join(' → ') : '';

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
          {/* El cierre no siempre lo hace el operador: lo puede cerrar su jefe de turno o el sistema */}
          {cierreAutomatico && !cerradoPor ? (
            <>
              El turno de <Text style={styles.actor}>{evento.actor}</Text> en{' '}
              <Text style={[styles.maquina, { color: acento }]}>{evento.maquina.nombre}</Text> se cerró automáticamente
            </>
          ) : cerradoPor ? (
            <>
              <Text style={styles.actor}>{cerradoPor}</Text> cerró el turno de <Text style={styles.actor}>{evento.actor}</Text> en{' '}
              <Text style={[styles.maquina, { color: acento }]}>{evento.maquina.nombre}</Text>
            </>
          ) : (
            <>
              <Text style={styles.actor}>{evento.actor}</Text> {verbo} <Text style={[styles.maquina, { color: acento }]}>{evento.maquina.nombre}</Text>
            </>
          )}
          {/* Reemplazo: qué máquina entró en su lugar */}
          {!!reemplazadaPor && (
            <>
              {' por '}
              <Text style={[styles.maquina, { color: acento }]}>{reemplazadaPor}</Text>
            </>
          )}
          {!!estadoNuevo && ` a ${presentacionEstado(estadoNuevo).etiqueta.toLowerCase()}`}
          {!!estadoSaliente && ` · queda ${presentacionEstado(estadoSaliente).etiqueta.toLowerCase()}`}
          {!!respaldoDevuelto && (
            <>
              {' · sale el respaldo '}
              <Text style={[styles.maquina, { color: acento }]}>{respaldoDevuelto}</Text>
            </>
          )}
        </Text>

        {!!evento.motivo && (
          <View style={[styles.motivo, { backgroundColor: acento + '14', borderColor: acento + '40' }]}>
            <Text style={[styles.motivoTexto, { color: acento }]}>{evento.motivo}</Text>
          </View>
        )}
        {!!cerradoPor && (
          <View style={[styles.motivo, styles.motivoConIcono, { backgroundColor: theme.warning + '14', borderColor: theme.warning + '40' }]}>
            <UserCheck size={12} color={theme.warning} />
            <Text style={[styles.motivoTexto, { color: theme.warningText }]}>
              {motivoCierre ? `Motivo: ${motivoCierre}` : 'Cerrado por el jefe de turno'}
            </Text>
          </View>
        )}
        {cierreAutomatico && !cerradoPor && (
          <View style={[styles.motivo, styles.motivoConIcono, { backgroundColor: theme.warning + '14', borderColor: theme.warning + '40' }]}>
            <AlarmClockOff size={12} color={theme.warning} />
            <Text style={[styles.motivoTexto, { color: theme.warningText }]}>Superó la duración máxima del turno</Text>
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
                <Text style={[styles.metaTexto, { color: theme.textSecondary }]}>{horometro}</Text>
              </View>
            )}
          </View>
        )}

        {!!traslado && (
          <View style={styles.metaFila}>
            <View style={styles.metaItem}>
              <MapPin size={12} color={theme.textTertiary} />
              <Text style={[styles.metaTexto, { color: theme.textSecondary }]} numberOfLines={2}>{traslado}</Text>
            </View>
          </View>
        )}

        <Text style={[styles.fecha, { color: theme.textTertiary }]}>{formatearFecha(evento.fecha)}</Text>
      </View>
    </View>
  );
};
