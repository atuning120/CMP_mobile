import React from 'react';
import { Alert } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { CloudCheck, CloudOff, RefreshCw, CloudUpload, Hourglass } from 'lucide-react-native';
import { ThemeColors } from '../constants/theme';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { leerSesion } from '../services/authStorage';
import { duenoDeSesion, listarOperacionesConError, reintentarOperacionesConError } from '../sync/colaSync';
import { solicitarSincronizacion } from '../sync/syncEngine';
import { useAccionUnica } from '../hooks/useAccionUnica';
import { StatusChip } from './StatusChip';

const ETIQUETAS: Record<string, string> = {
  INICIAR_TURNO: 'Inicio de turno',
  FINALIZAR_TURNO: 'Cierre de turno',
  REGISTRAR_ESTADO: 'Cambio de estado',
  CREAR_REPORTE: 'Reporte',
  SUBIR_EVIDENCIA: 'Foto de evidencia',
  ATENDER_ALERTA: 'Atención de alerta',
  CERRAR_TURNO: 'Cierre de turno',
  EDITAR_MAQUINA: 'Cambio en una máquina',
  CREAR_MAQUINA: 'Incorporación de máquina',
};

const RUTA_BANDEJA = '/acciones-pendientes';

/**
 * Estado de la sincronización en segundo plano: registros por subir y rechazados por el servidor. Al jefe de turno lo
 * lleva a "Acciones pendientes", donde decide qué hacer con cada una; al operador le muestra los rechazos.
 */
export const SyncIndicator: React.FC<{ theme: ThemeColors }> = ({ theme }) => {
  const { sincronizando, pendientes, errores, porConfirmar } = useSyncStatus();
  const router = useRouter();
  const ruta = usePathname();

  // Dos toques rápidos mostraban el aviso dos veces (cada uno lee la base antes de abrirlo)
  const [, ejecutarUnaVez] = useAccionUnica();
  const mostrarErrores = () => ejecutarUnaVez(async () => {
    const dueno = duenoDeSesion(await leerSesion());
    if (!dueno) return;
    if ('usuario' in dueno) {
      if (ruta !== RUTA_BANDEJA) router.push(RUTA_BANDEJA);
      return;
    }
    const operaciones = await listarOperacionesConError(dueno);
    const detalle = operaciones
      .slice(0, 5)
      .map((op) => `• ${ETIQUETAS[op.tipo] ?? op.tipo}: ${op.ultimoError ?? 'error desconocido'}`)
      .join('\n');
    Alert.alert('Registros no sincronizados', `El servidor rechazó ${operaciones.length} registro(s):\n\n${detalle}`, [
      { text: 'Cerrar', style: 'cancel' },
      {
        text: 'Reintentar',
        onPress: async () => {
          await reintentarOperacionesConError(dueno);
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
        label={porConfirmar > 0 ? `${errores + porConfirmar} por revisar · ver` : `${errores} con error · ver`}
        onPress={mostrarErrores}
      />
    );
  }
  // Acciones del jefe de turno de más de 24 h
  if (porConfirmar > 0) {
    return (
      <StatusChip
        theme={theme}
        icon={Hourglass}
        iconColor={theme.warning}
        textColor={theme.warningText}
        label={`${porConfirmar} por confirmar · ver`}
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
        onPress={() => ejecutarUnaVez(async () => {
          // El jefe de turno ve qué está esperando; el operador fuerza el envío
          const dueno = duenoDeSesion(await leerSesion());
          if (dueno && 'usuario' in dueno && ruta !== RUTA_BANDEJA) router.push(RUTA_BANDEJA);
          solicitarSincronizacion();
        })}
      />
    );
  }
  return (
    <StatusChip theme={theme} icon={CloudCheck} iconColor={theme.success} textColor={theme.successText} label="Sincronizado" />
  );
};
