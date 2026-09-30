import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, useColorScheme, useWindowDimensions, Alert, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, ChevronLeft, AlertCircle, RefreshCw } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../constants/theme';
import { useEvidenciasHistorial } from '../hooks/useEvidenciasHistorial';
import { EvidenceCard } from '../components/evidencias/EvidenceCard';
import { LoginHeader } from '../components/LoginHeader';
import { LoginFooter } from '../components/LoginFooter';

export default function EvidenciasScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const { width } = useWindowDimensions();
  
  // Grid col calculation (1 column for very narrow screens like old iphones < 360, else 2 cols)
  const isSmallScreen = width < 380;
  const numColumns = isSmallScreen ? 1 : 2;

  // Assuming operadorId = 1 for now (mocked context)
  const { evidencias, isLoading, error, refetch } = useEvidenciasHistorial(1);

  const handleCapturePress = () => {
    Alert.alert(
      "Capturar Evidencia",
      "El flujo de captura de evidencia (OP-10) está en desarrollo y se integrará aquí próximamente.",
      [{ text: "Entendido", style: "default" }]
    );
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Eliminar evidencia",
      "¿Estás seguro de que deseas eliminar esta evidencia que aún no ha sido sincronizada?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => console.log('Delete', id) }
      ]
    );
  };

  const handleDetail = (id: number) => {
    router.push(`/evidencias/detalle/${id}`);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>Evidencias Fotográficas</Text>
          <View style={[styles.badge, { backgroundColor: theme.primary + '20' }]}>
            <Text style={[styles.badgeText, { color: theme.primary }]}>
              {evidencias.length}
            </Text>
          </View>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Registro visual georreferenciado con horómetro para conciliación CMP.
      </Text>

      {/* Capture Button */}
      <TouchableOpacity 
        style={[styles.captureBtn, { backgroundColor: theme.primary }]}
        onPress={handleCapturePress}
      >
        <Camera size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
        <Text style={styles.captureBtnText}>Capturar / Subir Nueva Evidencia</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.centerText, { color: theme.textSecondary, marginTop: 16 }]}>
            Cargando historial de evidencias...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <AlertCircle size={48} color={theme.danger} style={{ marginBottom: 16 }} />
          <Text style={[styles.centerText, { color: theme.text }]}>Error al cargar las evidencias.</Text>
          <Text style={[styles.centerText, { color: theme.textSecondary, marginBottom: 24 }]}>
            {error.message}
          </Text>
          <TouchableOpacity 
            style={[styles.retryBtn, { borderColor: theme.primary }]} 
            onPress={refetch}
          >
            <RefreshCw size={16} color={theme.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.retryText, { color: theme.primary }]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Camera size={48} color={theme.textTertiary} style={{ marginBottom: 16 }} />
        <Text style={[styles.centerText, { color: theme.textSecondary }]}>
          Todavía no hay evidencias registradas.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
      <LoginHeader />
      <ImageBackground
        source={require('../../assets/images/Mina_fondo.jpg')}
        style={styles.container}
        imageStyle={{ opacity: colorScheme === 'dark' ? 0.5 : 0.6 }}
      >
        {/* Overlay para contraste y legibilidad profesional */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)' }]} />
        <FlatList
          key={numColumns} // Force re-render when columns change
          data={evidencias}
          keyExtractor={item => item.id.toString()}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
          contentContainerStyle={[styles.listContent, evidencias.length === 0 && { flexGrow: 1 }]}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          renderItem={({ item }) => (
            <View style={numColumns > 1 ? styles.gridItem : styles.fullItem}>
              <EvidenceCard 
                evidencia={item} 
                onPressDetalle={handleDetail}
                onPressEliminar={handleDelete}
              />
            </View>
          )}
        />
      </ImageBackground>
      <LoginFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  captureBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  row: {
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%', // Leaves space for gap
  },
  fullItem: {
    width: '100%',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  centerText: {
    fontSize: 16,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryText: {
    fontWeight: '600',
    fontSize: 14,
  }
});
