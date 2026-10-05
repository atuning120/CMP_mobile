import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ActivityIndicator, ScrollView, TouchableOpacity, ImageBackground, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Play, Square, Camera, AlertTriangle } from 'lucide-react-native';
import { lightTheme, darkTheme } from '../constants/theme';
import { LoginHeader } from '../components/LoginHeader';
import { LoginFooter } from '../components/LoginFooter';
import { useTurnoActual } from '../hooks/useTurnoActual';
import { ActionCard } from '../components/workzone/ActionCard';
import { StateChangeBanner } from '../components/workzone/StateChangeBanner';
import { TurnoSummaryDropdown } from '../components/workzone/TurnoSummaryDropdown';
import { StartShiftModal } from '../components/workzone/StartShiftModal';
import { EndShiftModal } from '../components/workzone/EndShiftModal';
import { ChangeStateModal } from '../components/workzone/ChangeStateModal';
import { cerrarSesion } from '../services/authService';
import { FOTOS_HABILITADAS } from '../constants/features';
import { FinalizarTurnoDatos, IniciarTurnoDatos } from '../types/turno';

const formatearFechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function WorkzoneScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const {
    turno,
    turnoCerradoAutomaticamente,
    isLoading,
    error,
    refetch,
    iniciarTurno,
    finalizarTurno,
    estadosCatalogo,
    updateEstadoActual,
  } = useTurnoActual();
  // Sin turno en curso solo se puede iniciar; con turno en curso solo se puede cerrar
  const hayTurnoEnCurso = turno !== null;
  const [isStartShiftModalVisible, setIsStartShiftModalVisible] = useState(false);
  const [isEndShiftModalVisible, setIsEndShiftModalVisible] = useState(false);
  const [isChangeStateModalVisible, setIsChangeStateModalVisible] = useState(false);

  // Cerrar sesión NO cierra el turno: sigue EN_CURSO en el teléfono y en el Backend
  const handleLogout = async () => {
    await cerrarSesion();
    router.replace('/');
  };

  const handleIniciarTurno = async (datos: IniciarTurnoDatos) => {
    await iniciarTurno(datos);
    setIsStartShiftModalVisible(false);
  };

  const handleFinalizarTurno = async (datos: FinalizarTurnoDatos) => {
    const estado = await finalizarTurno(datos);
    setIsEndShiftModalVisible(false);
    if (estado === 'CERRADO_AUTO') {
      Alert.alert(
        'Turno cerrado automáticamente',
        'El turno superó las 12 horas, por lo que se cerró en el límite. Se registró tu horómetro final; informa a tu jefe de turno.',
      );
    } else {
      Alert.alert('Turno cerrado', 'El turno se cerró correctamente. Se sincronizará con el servidor en segundo plano.');
    }
  };

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

    const cantidadEvidencias = turno?.cantidadEvidencias ?? 0;

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TurnoSummaryDropdown turno={turno} onLogout={handleLogout} />

        {!hayTurnoEnCurso && turnoCerradoAutomaticamente && (
          <View style={[styles.autoCloseBanner, { backgroundColor: theme.card, borderColor: theme.warning }]}>
            <AlertTriangle size={20} color={theme.warning} />
            <Text style={[styles.autoCloseText, { color: theme.text }]}>
              Tu turno{turnoCerradoAutomaticamente.id !== null ? ` #${turnoCerradoAutomaticamente.id}` : ''} (iniciado el {formatearFechaHora(turnoCerradoAutomaticamente.fechaInicio)}) se
              cerró automáticamente por superar 12 horas. Informa a tu jefe de turno para regularizar el horómetro final.
            </Text>
          </View>
        )}

        <View style={styles.actionsContainer}>
          <ActionCard
            icon={Play}
            iconColor={theme.success}
            title="Inicio de Turno"
            subtitle={hayTurnoEnCurso ? `Turno en curso desde ${formatearFechaHora(turno.fechaInicio)}` : 'Seleccionar máquina y registrar horómetro inicial.'}
            badgeText="PASO 1"
            disabled={hayTurnoEnCurso}
            onPress={() => setIsStartShiftModalVisible(true)}
          />
          <ActionCard
            icon={Square}
            iconColor={theme.danger}
            title="Cierre de Turno"
            subtitle={hayTurnoEnCurso ? 'Registrar horómetro final y liquidar horas.' : 'Disponible al iniciar un turno.'}
            badgeText="PASO FINAL"
            onPress={() => setIsEndShiftModalVisible(true)}
            disabled={!hayTurnoEnCurso}
            style={{ marginHorizontal: 8 }}
          />
          {/* Visible pero sin acción mientras las fotos estén desactivadas (pendiente Cloudinary) */}
          <ActionCard
            icon={Camera}
            iconColor={theme.warning}
            title="Evidencias"
            subtitle="Subir fotos de inspección, cancha o falla mecánica."
            badgeText={FOTOS_HABILITADAS ? `${cantidadEvidencias} FOTO${cantidadEvidencias === 1 ? '' : 'S'}` : 'PRÓXIMAMENTE'}
            onPress={() => {
              if (FOTOS_HABILITADAS) router.push('/evidencias');
            }}
          />
        </View>

        {hayTurnoEnCurso && (
          <StateChangeBanner
            estadosCatalogo={estadosCatalogo}
            onPress={() => setIsChangeStateModalVisible(true)}
          />
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
      <LoginHeader showConnectionStatus showSyncStatus />
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
        onConfirm={handleIniciarTurno}
      />

      <EndShiftModal
        visible={isEndShiftModalVisible}
        onClose={() => setIsEndShiftModalVisible(false)}
        onConfirm={handleFinalizarTurno}
        turno={turno}
      />

      <ChangeStateModal
        visible={isChangeStateModalVisible}
        onClose={() => setIsChangeStateModalVisible(false)}
        estadosCatalogo={estadosCatalogo}
        estadoActual={turno?.estadoOperacionalActual || null}
        // El panel queda abierto tras cambiar de estado: solo se cierra cuando el operador lo decide
        onStateChange={updateEstadoActual}
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
  autoCloseBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
  },
  autoCloseText: {
    flex: 1,
    fontSize: 13,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
});
