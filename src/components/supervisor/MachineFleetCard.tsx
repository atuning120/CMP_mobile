import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { AlertTriangle, User, MapPin, Clock, RefreshCw, Edit2, Undo2, CalendarClock, Link2, WifiOff } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { MaquinaFlota, regresoVencido } from '../../hooks/useFlotaResumen';
import { presentacionEstado } from '../../constants/estadosMaquina';
import { styles } from './MachineFleetCard.styles';

interface Props {
  maquina: MaquinaFlota;
  onSustituir: (maquina: MaquinaFlota) => void;
  onEditar: (maquina: MaquinaFlota) => void;
  onCambiarEstado: (maquina: MaquinaFlota) => void;
  onDevolver: (maquina: MaquinaFlota) => void;
  // Reemplazar y devolver cambian dos máquinas a la vez: solo se hacen con conexión, nunca quedan en cola
  conectado: boolean;
}

const formatoRegreso = new Intl.DateTimeFormat('es-CL', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export const MachineFleetCard: React.FC<Props> = ({ maquina, onSustituir, onEditar, onCambiarEstado, onDevolver, conectado }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const estado = presentacionEstado(maquina.estado);
  const colorEstado = estado.color(theme);
  // Se reemplaza una máquina que opera o que salió de operación por una falla; una en reserva no tiene a quién cubrir.
  // Con un respaldo ya puesto, lo que corresponde es devolverla
  const puedeReemplazar = maquina.estado !== 'EN_RESERVA' && !maquina.respaldo && !maquina.cubreA;
  const vencido = regresoVencido(maquina);
  const conRegreso = !!maquina.regresoEstimado && (maquina.estado === 'EN_MANTENIMIENTO' || maquina.estado === 'BAJA');
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

      {/* Regreso estimado: en rojo si ya pasó y la máquina sigue sin volver */}
      {conRegreso && (
        <View style={[styles.alertBlock, { backgroundColor: (vencido ? theme.danger : theme.primary) + '15' }]}>
          <CalendarClock size={16} color={vencido ? theme.danger : theme.primary} style={{ marginTop: 1 }} />
          <Text style={[styles.alertText, { color: vencido ? theme.dangerText : theme.primaryText }]}>
            {vencido ? 'Regreso vencido: ' : 'Vuelve: '}
            {formatoRegreso.format(new Date(maquina.regresoEstimado!))}
            {vencido ? ' · revisa con mantención' : ''}
          </Text>
        </View>
      )}

      {/* Enlace del reemplazo: quién la cubre, o a quién cubre este respaldo */}
      {(maquina.respaldo || maquina.cubreA) && (
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Link2 size={14} color={theme.primary} />
            <Text style={[styles.metaText, { color: theme.primaryText }]} numberOfLines={1}>
              {maquina.respaldo ? `Cubierta por ${maquina.respaldo.codigo}` : `Respaldo de ${maquina.cubreA!.codigo}`}
            </Text>
          </View>
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
        {!conectado && (maquina.respaldo || puedeReemplazar) ? (
          <View style={[styles.btnAction, { backgroundColor: superficieSecundaria, opacity: 0.6 }]}>
            <WifiOff size={16} color={theme.textSecondary} />
            <Text style={[styles.btnActionText, { color: theme.textSecondary }]}>
              {maquina.respaldo ? 'Devolver' : 'Reemplazo'} · Requiere conexión
            </Text>
          </View>
        ) : maquina.respaldo ? (
          <TouchableOpacity
            style={[styles.btnAction, { backgroundColor: theme.success }]}
            onPress={() => onDevolver(maquina)}
            activeOpacity={0.7}
          >
            <Undo2 size={16} color="#FFFFFF" />
            <Text style={[styles.btnActionText, { color: '#FFFFFF' }]}>Devolver a operación</Text>
          </TouchableOpacity>
        ) : (
        <TouchableOpacity
          style={[
            styles.btnAction, 
            { backgroundColor: puedeReemplazar ? theme.warning : superficieSecundaria, opacity: puedeReemplazar ? 1 : 0.6 }
          ]}
          onPress={() => puedeReemplazar && onSustituir(maquina)}
          disabled={!puedeReemplazar}
          activeOpacity={0.7}
        >
          <RefreshCw size={16} color={puedeReemplazar ? "#1A1A1A" : theme.textSecondary} />
          <Text style={[styles.btnActionText, { color: puedeReemplazar ? "#1A1A1A" : theme.textSecondary }]}>Sustituir / Reemplazo</Text>
        </TouchableOpacity>
        )}

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
