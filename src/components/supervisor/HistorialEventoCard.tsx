import React from 'react';
import { Text, View, useColorScheme } from 'react-native';
import { Ban, CheckCircle, Clock, Edit2, MapPin, Play, PlusCircle, RefreshCw, LucideIcon } from 'lucide-react-native';
import { darkTheme, lightTheme, ThemeColors } from '../../constants/theme';
import type { EventoHistorial, TipoEventoHistorial } from '../../services/historialService';
import { styles } from './HistorialEventoCard.styles';

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

// "hace 5 min", "hace 3 h", "ayer 14:30" o "05/10 14:30"
const formatearFecha = (iso: string) => {
  const fecha = new Date(iso);
  const minutos = Math.floor((Date.now() - fecha.getTime()) / 60000);
  const hora = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  if (minutos < 1) return 'recién';
  if (minutos < 60) return `hace ${minutos} min`;
  if (minutos < 12 * 60) return `hace ${Math.floor(minutos / 60)} h`;
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  if (fecha.toDateString() === new Date().toDateString()) return `hoy ${hora}`;
  if (fecha.toDateString() === ayer.toDateString()) return `ayer ${hora}`;
  return `${fecha.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })} ${hora}`;
};

const texto = (valor: unknown) => (typeof valor === 'string' && valor.trim() !== '' ? valor : null);

export const HistorialEventoCard: React.FC<Props> = ({ evento }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const { icono: Icono, verbo, color } = PRESENTACION[evento.tipo];
  const acento = color(theme);

  // Inicio de turno: dónde y con qué horómetro partió
  const ubicacion = [texto(evento.detalle?.area), texto(evento.detalle?.zona)].filter(Boolean).join(' · ');
  const horometro = Number(evento.detalle?.horometroInicial);

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
        {!!evento.observacion && <Text style={[styles.observacion, { color: theme.textSecondary }]}>{evento.observacion}</Text>}

        {evento.tipo === 'INICIO_TURNO' && (
          <View style={styles.metaFila}>
            {!!ubicacion && (
              <View style={styles.metaItem}>
                <MapPin size={12} color={theme.textTertiary} />
                <Text style={[styles.metaTexto, { color: theme.textSecondary }]} numberOfLines={1}>{ubicacion}</Text>
              </View>
            )}
            {Number.isFinite(horometro) && (
              <View style={styles.metaItem}>
                <Clock size={12} color={theme.textTertiary} />
                <Text style={[styles.metaTexto, { color: theme.textSecondary }]}>
                  {horometro.toLocaleString('es-CL', { maximumFractionDigits: 1 })} hrs
                </Text>
              </View>
            )}
          </View>
        )}

        <Text style={[styles.fecha, { color: theme.textTertiary }]}>{formatearFecha(evento.fecha)}</Text>
      </View>
    </View>
  );
};
