import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { AlertTriangle, User, MapPin, Clock, RefreshCw, Edit2 } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { MaquinaFlota } from '../../hooks/useFlotaResumen';
import { styles } from './MachineFleetCard.styles';

interface Props {
  maquina: MaquinaFlota;
  onSustituir: (maquina: MaquinaFlota) => void;
  onEditar: (maquina: MaquinaFlota) => void;
  onHabilitar: (maquina: MaquinaFlota) => void;
}

export const MachineFleetCard: React.FC<Props> = ({ maquina, onSustituir, onEditar, onHabilitar }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const isOperativo = maquina.estadoOperativo === 'OPERATIVO';

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.codigo, { color: theme.text }]}>{maquina.codigo}</Text>
          <View style={[styles.patenteBadge, { backgroundColor: theme.cardAlt }]}>
            <Text style={[styles.patenteText, { color: theme.textSecondary }]}>{maquina.patente}</Text>
          </View>
        </View>
        <View style={[
          styles.estadoBadge,
          { backgroundColor: isOperativo ? theme.success + '20' : theme.danger + '20' }
        ]}>
          {isOperativo ? <View style={[styles.dot, { backgroundColor: theme.success }]} /> : null}
          <Text style={[
            styles.estadoText,
            { color: isOperativo ? theme.success : theme.danger }
          ]}>
            {isOperativo ? 'Operativo' : 'Fuera Servicio'}
          </Text>
        </View>
      </View>

      <Text style={[styles.modelo, { color: theme.textSecondary }]}>{maquina.marcaModelo}</Text>

      {/* Alerta */}
      {!isOperativo && maquina.fallaActiva && (
        <View style={[styles.alertBlock, { backgroundColor: theme.danger + '15' }]}>
          <AlertTriangle size={16} color={theme.danger} style={{ marginTop: 2 }} />
          <Text style={[styles.alertText, { color: theme.danger }]}>{maquina.fallaActiva}</Text>
        </View>
      )}

      {/* Metadata Row 1 */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <User size={14} color={theme.textTertiary} />
          <Text style={[styles.metaText, { color: theme.text }]} numberOfLines={1}>
            {maquina.operadorAsignado || 'Sin operador asignado'}
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
      <View style={[styles.actionsRow, { borderTopColor: theme.border }]}>
        {!isOperativo ? (
          <>
            <TouchableOpacity
              style={[styles.btnAction, { backgroundColor: theme.warning }]}
              onPress={() => onSustituir(maquina)}
            >
              <RefreshCw size={16} color="#1A1A1A" />
              <Text style={[styles.btnActionText, { color: '#1A1A1A' }]}>Sustituir / Reemplazo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btnIcon, { backgroundColor: theme.cardAlt }]} onPress={() => onEditar(maquina)}>
              <Edit2 size={16} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnPill, { backgroundColor: theme.success }]}
              onPress={() => onHabilitar(maquina)}
            >
              <Text style={styles.btnPillText}>Habilitar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={[styles.btnIcon, { backgroundColor: theme.cardAlt }]} onPress={() => onEditar(maquina)}>
              <Edit2 size={16} color={theme.text} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

