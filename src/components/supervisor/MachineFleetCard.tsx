import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { AlertTriangle, User, MapPin, Clock, RefreshCw, Edit2 } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { MaquinaFlota } from '../../hooks/useFlotaResumen';
import { presentacionEstado } from '../../constants/estadosMaquina';
import { styles } from './MachineFleetCard.styles';

interface Props {
  maquina: MaquinaFlota;
  onSustituir: (maquina: MaquinaFlota) => void;
  onEditar: (maquina: MaquinaFlota) => void;
  onCambiarEstado: (maquina: MaquinaFlota) => void;
}

export const MachineFleetCard: React.FC<Props> = ({ maquina, onSustituir, onEditar, onCambiarEstado }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const estado = presentacionEstado(maquina.estado);
  const colorEstado = estado.color(theme);
  // Solo se reemplaza una máquina fuera de servicio
  const puedeReemplazar = maquina.estado === 'BAJA';
  const isDark = colorScheme === 'dark';
  // En modo oscuro los controles secundarios son translúcidos sobre la tarjeta, sin sombras
  const superficieSecundaria = isDark ? 'rgba(255,255,255,0.06)' : theme.cardAlt;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.glassSurface, borderColor: theme.glassSurfaceBorder },
        isDark && styles.cardOscura,
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.codigo, { color: theme.text }]}>{maquina.codigo}</Text>
          {!!maquina.patente && (
            <View style={[styles.patenteBadge, { backgroundColor: superficieSecundaria }]}>
              <Text style={[styles.patenteText, { color: theme.textSecondary }]}>{maquina.patente}</Text>
            </View>
          )}
        </View>
        <View style={styles.badges}>
          <View style={[styles.estadoBadge, { backgroundColor: colorEstado + '20' }]}>
            <View style={[styles.dot, { backgroundColor: colorEstado }]} />
            <Text style={[styles.estadoText, { color: estado.colorTexto(theme) }]}>{estado.etiqueta}</Text>
          </View>
          {/* No es un estado: acompaña a cualquiera cuando nadie tiene la máquina */}
          {maquina.sinOperador && (
            <View style={[styles.estadoBadge, { borderWidth: 1, borderColor: theme.border }]}>
              <User size={10} color={theme.textSecondary} />
              <Text style={[styles.estadoText, { color: theme.textSecondary }]}>Sin operador</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={[styles.modelo, { color: theme.textSecondary }]}>{maquina.marcaModelo}</Text>

      {/* Alerta */}
      {maquina.estado !== 'ACTIVA' && maquina.motivoEstado && (
        <View style={[styles.alertBlock, { backgroundColor: colorEstado + '15' }]}>
          <AlertTriangle size={16} color={colorEstado} style={{ marginTop: 2 }} />
          <Text style={[styles.alertText, { color: estado.colorTexto(theme) }]}>{maquina.motivoEstado}</Text>
        </View>
      )}

      {/* Metadata Row 1 */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <User size={14} color={theme.textTertiary} />
          <Text style={[styles.metaText, { color: theme.text }]} numberOfLines={1}>
            {/* Quien la opera ahora; si nadie, el operador a cargo */}
            {maquina.operadorEnTurno || maquina.operadorAsignado || 'Sin operador asignado'}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <MapPin size={14} color={theme.textTertiary} />
          <Text style={[styles.metaText, { color: theme.text }]} numberOfLines={1}>
            {maquina.zonaActual || 'Desconocida'}
          </Text>
        </View>
      </View>

      {/* Metadata Row 2 */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Clock size={14} color={theme.textTertiary} />
          <Text style={[styles.metaText, { color: theme.text }]}>
            {maquina.horometroActual.toLocaleString('es-CL', { minimumFractionDigits: 1 })} hrs
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={[styles.actionsRow, { borderTopColor: theme.glassSurfaceBorder }]}>
        <TouchableOpacity
          style={[
            styles.btnAction, 
            { backgroundColor: puedeReemplazar ? theme.warning : superficieSecundaria, opacity: puedeReemplazar ? 1 : 0.6 }
          ]}
          onPress={() => puedeReemplazar && onSustituir(maquina)}
          disabled={!puedeReemplazar}
          activeOpacity={0.7}
        >
          {/* Solo se permite reemplazo de equipos fuera de servicio */}
          <RefreshCw size={16} color={puedeReemplazar ? "#1A1A1A" : theme.textSecondary} />
          <Text style={[styles.btnActionText, { color: puedeReemplazar ? "#1A1A1A" : theme.textSecondary }]}>Sustituir / Reemplazo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btnIcon, { backgroundColor: superficieSecundaria }]} onPress={() => onEditar(maquina)}>
          <Edit2 size={16} color={theme.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnPill, { backgroundColor: theme.primary }]}
          onPress={() => onCambiarEstado(maquina)}
        >
          <Text style={styles.btnPillText}>Estado</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
