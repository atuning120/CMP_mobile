import { useState } from 'react';
import { presentacionEstado } from '../constants/estadosMaquina';
import { ApiError } from '../services/apiClient';
import { listarFlota, MAQUINA_MODIFICADA } from '../services/flotaService';
import { mensajeDeError } from '../utils/errores';
import type { MaquinaFlota } from './useFlotaResumen';

/**
 * Versión de la máquina sobre la que el jefe de turno prepara una acción (versionBase). Si otro jefe de turno la cambió
 * entremedio (409 MAQUINA_MODIFICADA), el mensaje de error dice cómo quedó y se adopta su versión: volver a confirmar
 * aplica el cambio sabiendo lo que hizo el otro.
 */
export const useVersionBase = (maquina: MaquinaFlota | null) => {
  const [adoptada, setAdoptada] = useState<{ para: MaquinaFlota; version: number } | null>(null);
  // Cada apertura del modal (otra máquina o la misma recargada) parte de la versión que se ve en la tarjeta
  const versionBase = maquina && adoptada?.para === maquina ? adoptada.version : (maquina?.version ?? undefined);

  const explicarError = async (error: unknown, porDefecto: string): Promise<string> => {
    const mensaje = mensajeDeError(error, porDefecto);
    if (!maquina || !(error instanceof ApiError) || error.code !== MAQUINA_MODIFICADA) return mensaje;
    const actual = (await listarFlota('').catch(() => null))?.find((m) => m.idMaquina === maquina.id);
    if (actual?.version === undefined) return mensaje;
    setAdoptada({ para: maquina, version: actual.version });
    const estado = presentacionEstado(actual.estado).etiqueta.toLowerCase();
    return `${mensaje}. Ahora está ${estado}. Si confirmas de nuevo, se aplica tu cambio.`;
  };

  return { versionBase, explicarError };
};
