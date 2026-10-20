import React from 'react';
import { Alert } from 'react-native';
import { CloudCheck, CloudOff, RefreshCw, CloudUpload } from 'lucide-react-native';
import { ThemeColors } from '../constants/theme';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { leerSesion } from '../services/authStorage';
import { listarOperacionesConError, reintentarOperacionesConError } from '../sync/colaSync';
import { solicitarSincronizacion } from '../sync/syncEngine';
import { useAccionUnica } from '../hooks/useAccionUnica';
import { StatusChip } from './StatusChip';

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

  // Dos toques rápidos mostraban el aviso dos veces (cada uno lee la base antes de abrirlo)
  const [, ejecutarUnaVez] = useAccionUnica();
  const mostrarErrores = () => ejecutarUnaVez(async () => {
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
  });

  if (errores > 0) {
    return (
      <StatusChip
        theme={theme}
        icon={CloudOff}
        iconColor={theme.danger}
        textColor={theme.dangerText}
        label={`${errores} con error · ver`}
        onPress={mostrarErrores}
      />
    );
  }
  if (sincronizando && pendientes > 0) {
    return (
      <StatusChip
        theme={theme}
        icon={RefreshCw}
        iconColor={theme.primary}
        textColor={theme.primaryText}
        label={`Sincronizando ${pendientes}…`}
      />
    );
  }
  if (pendientes > 0) {
    return (
      <StatusChip
        theme={theme}
        icon={CloudUpload}
        iconColor={theme.warning}
        textColor={theme.warningText}
        label={`${pendientes} por sincronizar`}
        onPress={solicitarSincronizacion}
      />
    );
  }
  return (
    <StatusChip theme={theme} icon={CloudCheck} iconColor={theme.success} textColor={theme.successText} label="Sincronizado" />
  );
};
