import * as Battery from 'expo-battery';
import TcpSocket from 'react-native-tcp-socket';
import { eliminarPosiciones, listarPosicionesPendientes, PosicionPendiente } from '../db/posicionLocal';
import { getAdaptadorHost, PUERTO_ADAPTADOR } from './adaptadorUrl';
import { heartbeat, imeiDeMaquina, leerAcks, login, PROTOCOLO_HEARTBEAT, ubicacion } from './gt06';

const TIMEOUT_MS = 20_000;
const TAMANO_LOTE = 50;
// Una posición más antigua que esto se marca como reenviada (guardada sin señal)
const TIEMPO_REAL_MS = 3 * 60 * 1000;

const nivelBateria = async (): Promise<number | null> => {
  const nivel = await Battery.getBatteryLevelAsync().catch(() => -1);
  return nivel < 0 ? null : Math.round(nivel * 100);
};

/**
 * Manda un lote por TCP como lo haría un LL301: login con el IMEI, heartbeat con la batería (el adaptador la
 * asocia a las posiciones siguientes), las posiciones y un heartbeat final. El adaptador procesa en orden, así
 * que el ACK de ese último heartbeat confirma que recibió todo el lote. Resuelve true solo con esa confirmación.
 */
const transmitir = (host: string, imei: string, lote: PosicionPendiente[], bateria: number | null) =>
  new Promise<boolean>((resolve) => {
    let serie = 1;
    let serieConfirmacion = -1;
    let recibido: number[] = [];
    let terminado = false;

    const socket = TcpSocket.createConnection({ host, port: PUERTO_ADAPTADOR, connectTimeout: TIMEOUT_MS }, () => {
      const ahora = Date.now();
      const tramas = [
        login(imei, serie++),
        heartbeat(bateria, serie++),
        ...lote.map((p) =>
          ubicacion(
            {
              fechaHora: new Date(p.fechaHora),
              latitud: p.latitud,
              longitud: p.longitud,
              velocidad: p.velocidad,
              rumbo: p.rumbo,
              enTiempoReal: ahora - Date.parse(p.fechaHora) < TIEMPO_REAL_MS,
            },
            serie++,
          ),
        ),
      ];
      serieConfirmacion = serie++;
      tramas.push(heartbeat(bateria, serieConfirmacion));
      socket.write(Uint8Array.from(tramas.flat()));
    });

    const terminar = (ok: boolean) => {
      if (terminado) return;
      terminado = true;
      socket.destroy();
      resolve(ok);
    };

    socket.on('data', (datos: string | Uint8Array) => {
      const bytes = typeof datos === 'string' ? Array.from(datos, (c) => c.charCodeAt(0)) : Array.from(datos);
      recibido = [...recibido, ...bytes];
      if (leerAcks(recibido).some((a) => a.protocolo === PROTOCOLO_HEARTBEAT && a.serie === serieConfirmacion)) terminar(true);
    });
    socket.on('error', () => terminar(false));
    socket.on('close', () => terminar(false));
    socket.setTimeout(TIMEOUT_MS, () => terminar(false));
  });

const enviar = async () => {
  const host = getAdaptadorHost();
  if (!host) return;
  // Lote a lote mientras el adaptador confirme; si falla, se reintenta con la próxima posición
  for (;;) {
    const pendientes = await listarPosicionesPendientes(TAMANO_LOTE);
    if (pendientes.length === 0) return;
    // Cada conexión es un dispositivo: normalmente todas son de la misma máquina (la del turno)
    const idMaquina = pendientes[0].idMaquina;
    const lote = pendientes.filter((p) => p.idMaquina === idMaquina);
    const confirmado = await transmitir(host, imeiDeMaquina(idMaquina), lote, await nivelBateria());
    if (!confirmado) return;
    await eliminarPosiciones(lote.map((p) => p.id));
  }
};

// Un solo envío a la vez: quien llama mientras hay uno en curso espera ese mismo
let envioEnCurso: Promise<void> | null = null;

export const enviarPosicionesPendientes = (): Promise<void> => {
  envioEnCurso ??= enviar()
    .catch((error) => console.warn('No se pudieron enviar las posiciones:', error))
    .finally(() => {
      envioEnCurso = null;
    });
  return envioEnCurso;
};
