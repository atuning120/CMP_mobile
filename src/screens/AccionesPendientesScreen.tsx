import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ban, ChevronLeft, CircleCheck, Clock, RefreshCw, Trash2 } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../constants/theme';
import { LoginHeader } from '../components/LoginHeader';
import { LoginFooter } from '../components/LoginFooter';
import { AccionPendienteCard } from '../components/supervisor/AccionPendienteCard';
import { useAccionesPendientes } from '../hooks/useAccionesPendientes';
import { useConectado } from '../hooks/useConectado';
import { type AccionEnBandeja, aplicarSobreEstadoActual, descartarAccion, enviarIgual } from '../services/accionesJefe';
import { mostrarAviso } from '../services/retroalimentacion';
import { solicitarSincronizacion } from '../sync/syncEngine';
import type { EventoRegistro } from '../db/registroAcciones';
import { HORAS_CONFIRMACION, HORAS_VENCIMIENTO } from '../sync/vigenciaAcciones';
import { formatearFecha } from '../utils/historialFechas';
import { mensajeDeError } from '../utils/errores';
import { styles } from './AccionesPendientesScreen.styles';

const TITULO_EVENTO: Record<EventoRegistro, string> = {
  VENCIDA: `Descartada: pasó las ${HORAS_VENCIMIENTO} h`,
  DESCARTADA: 'La descartaste',
  TURNO_YA_CERRADO: 'El turno ya estaba cerrado',
};

/**
 * Acciones pendientes del jefe de turno: lo que hizo sin señal y aún no llega al Backend. Arriba lo que necesita su
 * decisión (conflictos con otro jefe de turno, rechazos y las de más de 24 h), luego lo que solo espera conexión y al
 * final el registro de lo que se descartó o tuvo un aviso.
 */
export const AccionesPendientesScreen = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const conectado = useConectado();
  const { porRevisar, enEspera, registro } = useAccionesPendientes();
  // Una decisión a la vez por acción (los toques repetidos no la repiten)
  const [ocupada, setOcupada] = useState<number | null>(null);

  const decidir = async (accion: AccionEnBandeja, hacer: (id: number) => Promise<void>, aviso: string) => {
    if (ocupada !== null) return;
    setOcupada(accion.id);
    try {
      await hacer(accion.id);
      mostrarAviso(aviso, { detalle: accion.descripcion });
    } catch (error) {
      Alert.alert('No se pudo completar', mensajeDeError(error, 'Intenta nuevamente en unos segundos.'));
    } finally {
      setOcupada(null);
    }
  };

  const confirmarDescarte = (accion: AccionEnBandeja) =>
    Alert.alert('Descartar acción', `${accion.descripcion}. Se borra de este teléfono y no se envía.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => void decidir(accion, descartarAccion, 'Acción descartada') },
    ]);

  const tarjeta = (accion: AccionEnBandeja) => (
    <AccionPendienteCard
      key={accion.id}
      accion={accion}
      ocupada={ocupada === accion.id}
      onEnviarIgual={(a) => void decidir(a, enviarIgual, conectado ? 'Acción enviada' : 'Se enviará al recuperar la conexión')}
      onAplicarSobreActual={(a) => void decidir(a, aplicarSobreEstadoActual, 'Acción aplicada sobre el estado actual')}
      onDescartar={confirmarDescarte}
    />
  );

  const iconoRegistro = (evento: EventoRegistro) =>
    evento === 'VENCIDA' ? (
      <Clock size={16} color={theme.danger} />
    ) : evento === 'DESCARTADA' ? (
      <Trash2 size={16} color={theme.textTertiary} />
    ) : (
      <Ban size={16} color={theme.warning} />
    );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <LoginHeader showConnectionStatus showSyncStatus />
      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.barra}>
          <TouchableOpacity style={styles.volver} onPress={() => router.back()} accessibilityLabel="Volver">
            <ChevronLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.titulo, { color: theme.text }]}>Acciones pendientes</Text>
        </View>
        <Text style={[styles.subtitulo, { color: theme.textSecondary }]}>
          Lo que hiciste sin señal y aún no llega al servidor. Las de más de {HORAS_CONFIRMACION} h esperan que las confirmes y
          las de más de {HORAS_VENCIMIENTO} h se descartan solas. Las notas de alertas no vencen.
        </Text>

        <Text style={[styles.seccion, { color: theme.textTertiary }]}>NECESITAN TU DECISIÓN</Text>
        {porRevisar.length === 0 ? (
          <Text style={[styles.vacio, { color: theme.textSecondary }]}>Nada por revisar.</Text>
        ) : (
          porRevisar.map(tarjeta)
        )}

        <Text style={[styles.seccion, { color: theme.textTertiary }]}>ESPERANDO CONEXIÓN</Text>
        {enEspera.length === 0 ? (
          <Text style={[styles.vacio, { color: theme.textSecondary }]}>Todo lo demás ya se envió.</Text>
        ) : (
          <>
            {conectado && (
              <TouchableOpacity style={[styles.enviarAhora, { borderColor: theme.primary }]} onPress={solicitarSincronizacion}>
                <RefreshCw size={15} color={theme.primary} />
                <Text style={[styles.enviarAhoraTexto, { color: theme.primaryText }]}>Enviar ahora</Text>
              </TouchableOpacity>
            )}
            {enEspera.map(tarjeta)}
          </>
        )}

        <Text style={[styles.seccion, { color: theme.textTertiary }]}>REGISTRO</Text>
        {registro.length === 0 ? (
          <Text style={[styles.vacio, { color: theme.textSecondary }]}>Sin acciones descartadas.</Text>
        ) : (
          registro.map((r) => (
            <View key={r.id} style={[styles.registro, { borderBottomColor: theme.border }]}>
              {iconoRegistro(r.evento)}
              <View style={styles.registroTextos}>
                <Text style={[styles.registroTitulo, { color: theme.text }]}>{r.descripcion}</Text>
                <Text style={[styles.registroDetalle, { color: theme.textSecondary }]}>
                  {TITULO_EVENTO[r.evento]} · {formatearFecha(r.registradoEn)}
                  {r.fechaAccion ? ` · hecha ${formatearFecha(r.fechaAccion)}` : ''}
                </Text>
                {!!r.detalle && <Text style={[styles.registroDetalle, { color: theme.textSecondary }]}>{r.detalle}</Text>}
              </View>
            </View>
          ))
        )}
        {porRevisar.length === 0 && enEspera.length === 0 && (
          <View style={[styles.barra, { marginTop: 16 }]}>
            <CircleCheck size={16} color={theme.success} />
            <Text style={[styles.vacio, { color: theme.successText, marginBottom: 0 }]}>Todo lo que hiciste ya está en el servidor.</Text>
          </View>
        )}
      </ScrollView>
      <LoginFooter />
    </SafeAreaView>
  );
};
