import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ActivityIndicator, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Play, Square, Camera, LogOut } from 'lucide-react-native';
import { lightTheme, darkTheme } from '../constants/theme';
import { LoginHeader } from '../components/LoginHeader';
import { LoginFooter } from '../components/LoginFooter';
import { useTurnoActual } from '../hooks/useTurnoActual';
import { MachineStatusCard } from '../components/workzone/MachineStatusCard';
import { ActionCard } from '../components/workzone/ActionCard';
import { StateChangeBanner } from '../components/workzone/StateChangeBanner';
import { TurnoSummaryDropdown } from '../components/workzone/TurnoSummaryDropdown';
import { StartShiftModal } from '../components/workzone/StartShiftModal';

export default function WorkzoneScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const { turno, isLoading, error, refetch, estadosCatalogo } = useTurnoActual();
  const [isStartShiftModalVisible, setIsStartShiftModalVisible] = useState(false);

  const handleLogout = () => {
    router.replace('/');
  };

  useEffect(() => {
    if (!isLoading && !error && turno === null) {
      // Redirigir a OP-02 (Iniciar Turno)
      // Como aún no existe esa pantalla en este mock, usamos '/iniciar-turno'
      // O podemos redirigir al home (login) si falla
      console.log('No hay turno, redirigiendo a iniciar turno...');
      //router.replace('/iniciar-turno');
    }
  }, [turno, isLoading, error, router]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Cargando información del turno...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={{ color: theme.danger, marginBottom: 12 }}>{error.message}</Text>
          <TouchableOpacity
            onPress={refetch}
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!turno) {
      return (
        <View style={styles.centerContainer}>
          <Text style={{ color: theme.text }}>Redirigiendo a Iniciar Turno...</Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TurnoSummaryDropdown turno={turno} onLogout={handleLogout} />
        <View style={styles.actionsContainer}>
          <ActionCard
            icon={Play}
            iconColor={theme.success}
            title="Inicio de Turno"
            subtitle="Turno ya en curso"
            badgeText="PASO 1"
            disabled={false}
            onPress={() => setIsStartShiftModalVisible(true)}
          />
          <ActionCard
            icon={Square}
            iconColor={theme.danger}
            title="Cierre de Turno"
            subtitle="Registrar horómetro final y liquidar horas."
            badgeText="PASO FINAL"
            onPress={() => console.log('Navegar a OP-05')}
            disabled={false}
            style={{ marginHorizontal: 8 }}
          />
          <ActionCard
            icon={Camera}
            iconColor={theme.warning}
            title="Evidencias"
            subtitle="Subir fotos de inspección, cancha o falla mecánica."
            badgeText={`${turno.cantidadEvidencias} FOTO${turno.cantidadEvidencias === 1 ? '' : 'S'}`}
            onPress={() => console.log('Navegar a OP-10')}
          />
        </View>

        <StateChangeBanner
          estadosCatalogo={estadosCatalogo}
          onPress={() => console.log('Abrir modal OP-03')}
        />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
      <LoginHeader />
      <ImageBackground
        source={require('../../assets/images/Mina_fondo.jpg')}
        style={styles.mainContent}
        imageStyle={{ opacity: colorScheme === 'dark' ? 0.3 : 0.9 }}
      >
        {renderContent()}
      </ImageBackground>
      <LoginFooter />

      <StartShiftModal 
        visible={isStartShiftModalVisible} 
        onClose={() => setIsStartShiftModalVisible(false)} 
        onConfirm={() => {
          setIsStartShiftModalVisible(false);
          console.log('Turno Iniciado');
        }} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
});
