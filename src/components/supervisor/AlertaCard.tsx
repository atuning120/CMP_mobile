import React from 'react';
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { AlarmClockOff, AlertTriangle, CheckCircle, Clock, Layers, MapPin, MessageSquarePlus, Timer } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import type { Alerta } from '../../services/alertasService';
import { formatearDuracion, formatearFecha } from '../../utils/historialFechas';
import { styles } from './HistorialEventoCard.styles';
import { estilosAtencion } from './AlertaCard.styles';

interface Props {
  alerta: Alerta;
  // Abre el modal para atenderla o agregarle una nota
  onAtender?: (alerta: Alerta) => void;
}

const minutosEntre = (desde: string, hasta: string | null) =>
  ((hasta ? new Date(hasta).getTime() : Date.now()) - new Date(desde).getTime()) / 60000;

// Misma tarjeta que el historial: icono, quién y qué máquina, una etiqueta con el estado y los datos del turno
export const AlertaCard: React.FC<Props> = ({ alerta, onAtender }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const { turno } = alerta;
  const esCierreAutomatico = alerta.tipo === 'CIERRE_AUTOMATICO';
  const jornada = alerta.tipo === 'JORNADA_EXTENDIDA' ? (alerta.jornada ?? null) : null;
  // Turno o jornada extendidos que siguen abiertos: son las alertas que todavía requieren acción
  const activa = !esCierreAutomatico && turno.estado === 'EN_CURSO';
  const acento = esCierreAutomatico ? theme.danger : theme.warning;
  const Icono = esCierreAutomatico ? AlarmClockOff : jornada ? Layers : AlertTriangle;
  const duracion = formatearDuracion(minutosEntre(turno.horaInicio, turno.horaTermino));
  const ubicacion = [alerta.area, alerta.zona].filter(Boolean).join(' · ');
  // La primera atención es quién la atendió; las siguientes, notas posteriores
  const [atencion, ...notas] = alerta.atenciones ?? [];

  const etiqueta = esCierreAutomatico
    ? `Cierre automático tras ${duracion} · posible olvido de cierre`
    : jornada
      ? `${formatearDuracion(jornada.horas * 60)} en ${jornada.turnos} turnos${activa ? ' y sigue trabajando' : ''}`
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
          ) : jornada ? (
            <>
              <Text style={styles.actor}>{alerta.operador}</Text> {activa ? 'lleva más de 10 h' : 'superó las 10 h'} de jornada sumando
              turnos; ahora en{' '}
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
            <Text style={[styles.metaTexto, { color: theme.textSecondary }]}>
              {jornada ? `Jornada desde ${formatearFecha(jornada.inicio)}` : `Inicio ${formatearFecha(turno.horaInicio)}`}
            </Text>
          </View>
        </View>

        {!!atencion && (
          <View style={[estilosAtencion.registro, { backgroundColor: theme.cardAlt, borderLeftColor: theme.success }]}>
            <View style={estilosAtencion.fila}>
              <CheckCircle size={13} color={theme.success} />
              <Text style={[estilosAtencion.texto, { color: theme.text }]}>
                Atendida por <Text style={styles.actor}>{atencion.usuario}</Text> · {formatearFecha(atencion.fecha)}
              </Text>
            </View>
            {!!atencion.comentario && <Text style={[estilosAtencion.texto, { color: theme.text }]}>{atencion.comentario}</Text>}
            {notas.map((nota, i) => (
              <View key={i} style={[estilosAtencion.nota, { borderTopColor: theme.border }]}>
                <Text style={[estilosAtencion.autor, { color: theme.textTertiary }]}>
                  Nota de {nota.usuario} · {formatearFecha(nota.fecha)}
                </Text>
                <Text style={[estilosAtencion.texto, { color: theme.text }]}>{nota.comentario}</Text>
              </View>
            ))}
          </View>
        )}

        {!!onAtender && alerta.atenciones !== undefined && (
          <TouchableOpacity
            style={[
              estilosAtencion.boton,
              atencion
                ? { borderColor: theme.border }
                : { borderColor: theme.success + '73', backgroundColor: theme.success + '1A' },
            ]}
            onPress={() => onAtender(alerta)}
            activeOpacity={0.7}
          >
            {atencion ? <MessageSquarePlus size={14} color={theme.primary} /> : <CheckCircle size={14} color={theme.success} />}
            <Text style={[estilosAtencion.botonTexto, { color: atencion ? theme.primary : theme.success }]}>
              {atencion ? 'Agregar nota' : 'Atender'}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.fecha, { color: theme.textTertiary }]}>{formatearFecha(alerta.fecha)}</Text>
      </View>
    </View>
  );
};
