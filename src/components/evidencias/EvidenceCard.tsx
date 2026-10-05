import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useColorScheme } from 'react-native';
import { MapPin, Clock, Trash2, Eye, CloudLightning, CloudOff, CloudCog } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { EvidenciaHistorial } from '../../hooks/useEvidenciasHistorial';

interface EvidenceCardProps {
  evidencia: EvidenciaHistorial;
  onPressDetalle: (id: string) => void;
  onPressEliminar: (id: string) => void;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ evidencia, onPressDetalle, onPressEliminar }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('es-CL', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSyncStatusConfig = (status: EvidenciaHistorial['estadoSincronizacion']) => {
    switch (status) {
      case 'SINCRONIZADO':
        return { color: theme.success, text: 'Sincronizado', Icon: CloudLightning };
      case 'PENDIENTE':
        return { color: theme.warning, text: 'Pendiente', Icon: CloudCog };
      case 'ERROR_SINCRONIZACION':
        return { color: theme.danger, text: 'Error Sinc.', Icon: CloudOff };
    }
  };

  const syncConfig = getSyncStatusConfig(evidencia.estadoSincronizacion);
  const SyncIcon = syncConfig.Icon;
  const canDelete = evidencia.estadoSincronizacion !== 'SINCRONIZADO';

  return (
    <View style={[styles.card, { backgroundColor: theme.cardAlt }]}>
      <View style={styles.cardInner}>
        
        {/* Thumbnail con Badge Superpuesto */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: evidencia.urlFoto }} 
            style={styles.image}
            resizeMode="cover"
          />
          <View style={[styles.syncBadge, { backgroundColor: syncConfig.color }]}>
            <SyncIcon size={12} color="#FFF" style={styles.syncIcon} />
            <Text style={styles.syncText}>{syncConfig.text}</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          
          {/* Descripción */}
          <Text style={[styles.description, { color: theme.text }]} numberOfLines={2}>
            {evidencia.descripcionReporte}
          </Text>

          {/* Metadata (Área y Fecha) */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MapPin size={12} color={theme.textTertiary} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]} numberOfLines={1}>
                {evidencia.area}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={12} color={theme.textTertiary} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {formatDate(evidencia.fechaHora)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer de Acciones */}
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <TouchableOpacity 
            style={styles.btnDetalle} 
            onPress={() => onPressDetalle(evidencia.id)}
          >
            <Eye size={16} color={theme.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.btnDetalleText, { color: theme.primary }]}>Ver detalle</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.btnEliminar, !canDelete && { opacity: 0.3 }]} 
            onPress={() => canDelete && onPressEliminar(evidencia.id)}
            disabled={!canDelete}
          >
            <Trash2 size={18} color={canDelete ? theme.danger : theme.textTertiary} />
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
    flex: 1, // To fill grid columns nicely
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  cardInner: {
    borderRadius: 16,
    overflow: 'hidden',
    flex: 1,
  },
  imageContainer: {
    height: 140,
    width: '100%',
    position: 'relative',
    backgroundColor: '#333',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  syncBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  syncIcon: {
    marginRight: 4,
  },
  syncText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  contentContainer: {
    padding: 16,
  },
  description: {
    fontSize: 14.5,
    fontWeight: '600',
    marginBottom: 14,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'column',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '400',
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  btnDetalle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  btnDetalleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  btnEliminar: {
    padding: 8,
    borderRadius: 8,
  }
});
