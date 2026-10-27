import { getDb } from '../db/database';
import { completarOperacion, duenoDeSesion, encolarAccionJefe, hayOperacionesConClave, listarOperaciones } from '../sync/colaSync';
import { emitirCambioDatos } from '../sync/eventos';
import { refrescarContadores, solicitarSincronizacion } from '../sync/syncEngine';
import { ErrorParaUsuario } from '../utils/errores';
import { ApiError } from './apiClient';
import { atenderAlerta, type Alerta, type AtencionAlerta } from './alertasService';
import { leerOperadorCache, leerSesion } from './authStorage';

/*
 * Acciones del jefe de turno que se pueden hacer sin señal. Se intentan enviar al momento; si el Backend no
 * responde, quedan en la cola (src/sync/colaSync.ts) y el motor de sincronización las envía al volver la red,
 * con la fecha en que se hicieron. Las pantallas llaman a estas funciones, nunca a la cola directamente.
 */

// Sin señal, timeout o servidor caído: reenviarla más tarde puede funcionar. Un 4xx no cambiará
const esFallaTransitoria = (error: unknown) =>
  error instanceof ApiError && (error.status === 0 || error.status === 408 || error.status === 429 || error.status >= 500);

const claveAlerta = (idAlerta: string) => `alerta:${idAlerta}`;

const duenoActual = async () => {
  const dueno = duenoDeSesion(await leerSesion());
  if (!dueno || !('usuario' in dueno)) throw new ErrorParaUsuario('Tu sesión expiró. Vuelve a iniciar sesión.');
  return dueno;
};

// Nombre con que se muestra una atención aún no enviada (el Backend usará el del usuario)
const nombreAutor = async () => {
  const perfil = await leerOperadorCache();
  return [perfil?.nombre, perfil?.apellido].filter(Boolean).join(' ') || 'Tú';
};

export type ResultadoAtencion = { enviada: true; atenciones: AtencionAlerta[] } | { enviada: false };

/**
 * Atiende la alerta o le agrega una nota. Con conexión devuelve sus atenciones; sin conexión la deja en la cola
 * (`enviada: false`) y la tarjeta la muestra como pendiente de envío. Las notas no vencen.
 * idCliente y fechaAccion: los mismos en cada reintento del modal.
 */
export const atenderAlertaJefe = async (
  alerta: Alerta,
  comentario: string,
  idCliente: string,
  fechaAccion: string,
): Promise<ResultadoAtencion> => {
  const dueno = await duenoActual();
  // Incluye las de este teléfono aún no enviadas: llegarán antes que esta
  const atencionesVistas = alerta.atenciones?.length ?? 0;
  const clave = claveAlerta(alerta.id);

  // Si quedó otra atención de esta alerta esperando, esta va detrás para respetar el orden
  if (!(await hayOperacionesConClave(dueno, clave))) {
    try {
      const { atenciones } = await atenderAlerta(alerta.id, comentario, idCliente, atencionesVistas);
      return { enviada: true, atenciones };
    } catch (error) {
      if (!esFallaTransitoria(error)) throw error;
    }
  }

  await encolarAccionJefe(await getDb(), {
    tipo: 'ATENDER_ALERTA',
    idEntidad: idCliente,
    usuario: dueno.usuario,
    claveBloqueo: clave,
    fechaAccion,
    payload: { idAlerta: alerta.id, comentario, atencionesVistas, autor: await nombreAutor() },
  });
  emitirCambioDatos();
  await refrescarContadores();
  solicitarSincronizacion();
  return { enviada: false };
};

export interface AtencionPendiente {
  idAlerta: string;
  atencion: AtencionAlerta;
}

// Atenciones hechas sin señal que aún no llegan al Backend, en el orden en que se hicieron
export const listarAtencionesPendientes = async (): Promise<AtencionPendiente[]> => {
  const dueno = duenoDeSesion(await leerSesion());
  if (!dueno || !('usuario' in dueno)) return [];
  const operaciones = await listarOperaciones(dueno, 'ATENDER_ALERTA');
  return operaciones.map((op) => {
    const p = op.payload as { idAlerta: string; comentario: string; autor: string };
    return {
      idAlerta: p.idAlerta,
      atencion: {
        usuario: p.autor,
        fecha: op.fechaAccion ?? new Date().toISOString(),
        comentario: p.comentario || null,
        pendiente: { idOperacion: op.id, error: op.estado === 'ERROR' ? op.ultimoError : null },
      },
    };
  });
};

// El jefe de turno descarta una atención que el servidor rechazó (o que ya no quiere enviar)
export const descartarAtencionPendiente = async (idOperacion: number) => {
  await completarOperacion(idOperacion);
  emitirCambioDatos();
  await refrescarContadores();
  // Las que esperaban detrás de ella (misma alerta) ya pueden enviarse
  solicitarSincronizacion();
};
