import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, useColorScheme, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, MapPin, Clock, Info } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../constants/theme';
import { useEvidenciasHistorial } from '../hooks/useEvidenciasHistorial';

export default function EvidenciaDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const { evidencias, isLoading } = useEvidenciasHistorial();

  const evidencia = useMemo(() => {
    return evidencias.find(e => e.id === id);
  }, [id, evidencias]);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('es-CL', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.textSecondary }}>Cargando detalle...</Text>
      </View>
    );
  }

  if (!evidencia) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.danger, marginBottom: 16 }}>Evidencia no encontrada</Text>
        <TouchableOpacity style={{ padding: 10, backgroundColor: theme.cardAlt, borderRadius: 8 }} onPress={() => router.back()}>
          <Text style={{ color: theme.text }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Transparente con Botón Volver */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]} onPress={() => router.back()}>
          <ChevronLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Imagen Full Size */}
      <View style={styles.imageWrapper}>
        <Image 
          source={{ uri: evidencia.urlFoto }} 
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* Metadata */}
      <View style={[styles.bottomSheet, { backgroundColor: theme.card }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          
          <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginBottom: 8 }]}>DETALLES DEL REPORTE</Text>
          <Text style={[styles.description, { color: theme.text }]}>
            {evidencia.descripcionReporte}
          </Text>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
              <View style={[styles.iconWrapper, { backgroundColor: theme.cardAlt }]}>
                <MapPin size={20} color={theme.primary} />
              </View>
              <View style={styles.metaTextContainer}>
                <Text style={[styles.metaLabel, { color: theme.textTertiary }]}>Área del Turno</Text>
                <Text style={[styles.metaValue, { color: theme.text }]}>{evidencia.area}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={[styles.iconWrapper, { backgroundColor: theme.cardAlt }]}>
                <Clock size={20} color={theme.warning} />
              </View>
              <View style={styles.metaTextContainer}>
                <Text style={[styles.metaLabel, { color: theme.textTertiary }]}>Fecha y Hora de Captura</Text>
                <Text style={[styles.metaValue, { color: theme.text, textTransform: 'capitalize' }]}>
                  {formatDate(evidencia.fechaHora)}
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={[styles.iconWrapper, { backgroundColor: theme.cardAlt }]}>
                <Info size={20} color={theme.textSecondary} />
              </View>
              <View style={styles.metaTextContainer}>
                <Text style={[styles.metaLabel, { color: theme.textTertiary }]}>Estado de Sincronización</Text>
                <Text style={[
                  styles.metaValue, 
                  { 
                    color: evidencia.estadoSincronizacion === 'SINCRONIZADO' ? theme.success : 
                           evidencia.estadoSincronizacion === 'PENDIENTE' ? theme.warning : theme.danger
                  }
                ]}>
                  {evidencia.estadoSincronizacion.replace('_', ' ')}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 44, // Safe area aprox for iOS/Android
    left: 16,
    zIndex: 10,
  },
  backBtn: {
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bottomSheet: {
    height: '45%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    marginTop: -20, // Overlap the image a bit
  },
  scrollContent: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 20,
  },
  metaContainer: {
    gap: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaTextContainer: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: '500',
  }
});
