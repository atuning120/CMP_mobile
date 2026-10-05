import React from 'react';
import { Alert, Text, TouchableOpacity } from 'react-native';
import { CloudCheck, CloudOff, RefreshCw, CloudUpload } from 'lucide-react-native';
import { ThemeColors } from '../constants/theme';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { leerSesion } from '../services/authStorage';
import { listarOperacionesConError, reintentarOperacionesConError } from '../sync/colaSync';
import { solicitarSincronizacion } from '../sync/syncEngine';
import { styles } from './SyncIndicator.styles';

const ETIQUETAS: Record<string, string> = {
  INICIAR_TURNO: 'Inicio de turno',
  FINALIZAR_TURNO: 'Cierre de turno',
  REGISTRAR_ESTADO: 'Cambio de estado',
  CREAR_REPORTE: 'Reporte',
  SUBIR_EVIDENCIA: 'Foto de evidencia',
};

/**
 * Estado de la sincronización en segundo plano: registros por subir y rechazados por el servidor.
 */
export const SyncIndicator: React.FC<{ theme: ThemeColors }> = ({ theme }) => {
  const { sincronizando, pendientes, errores } = useSyncStatus();

  const mostrarErrores = async () => {
    const sesion = await leerSesion();
    if (!sesion?.idOperador) return;
    const operaciones = await listarOperacionesConError(sesion.idOperador);
    const detalle = operaciones
      .slice(0, 5)
      .map((op) => `• ${ETIQUETAS[op.tipo] ?? op.tipo}: ${op.ultimoError ?? 'error desconocido'}`)
      .join('\n');
    Alert.alert('Registros no sincronizados', `El servidor rechazó ${operaciones.length} registro(s):\n\n${detalle}`, [
      { text: 'Cerrar', style: 'cancel' },
      {
        text: 'Reintentar',
        onPress: async () => {
          await reintentarOperacionesConError(sesion.idOperador!);
          solicitarSincronizacion();
        },
      },
    ]);
  };

  if (errores > 0) {
    return (
      <TouchableOpacity style={styles.fila} onPress={mostrarErrores}>
        <CloudOff size={12} color={theme.danger} />
        <Text style={[styles.texto, { color: theme.danger }]}>{errores} con error · ver</Text>
      </TouchableOpacity>
    );
  }
  if (sincronizando && pendientes > 0) {
    return (
      <TouchableOpacity style={styles.fila} disabled>
        <RefreshCw size={12} color={theme.primary} />
        <Text style={[styles.texto, { color: theme.primary }]}>Sincronizando {pendientes}…</Text>
      </TouchableOpacity>
    );
  }
  if (pendientes > 0) {
    return (
      <TouchableOpacity style={styles.fila} onPress={solicitarSincronizacion}>
        <CloudUpload size={12} color={theme.warning} />
        <Text style={[styles.texto, { color: theme.warning }]}>{pendientes} por sincronizar</Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity style={styles.fila} disabled>
      <CloudCheck size={12} color={theme.success} />
      <Text style={[styles.texto, { color: theme.success }]}>Todo sincronizado</Text>
    </TouchableOpacity>
  );
};
