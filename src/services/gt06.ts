/*
 * Tramas del protocolo GT06 (el del GPS Jimi LL301). Mientras llegan los LL301, el teléfono se hace pasar por
 * uno: se conecta al adaptador por TCP y manda las mismas tramas, con un IMEI virtual por máquina. Así el
 * adaptador y el Backend no cambian cuando se instalen los GPS reales. Misma codificación que
 * src/gt06/codificador.ts del adaptador.
 *   trama: 78 78 | largo | protocolo | contenido | serie (2) | CRC (2) | 0D 0A
 */

export const PROTOCOLO_LOGIN = 0x01;
export const PROTOCOLO_HEARTBEAT = 0x13;
const PROTOCOLO_UBICACION = 0x22;

// IMEI virtual de la máquina: '9' + id en 14 dígitos (la máquina 12 es 900000000000012). El Backend lo tiene
// registrado en DISPOSITIVO_GPS y asignado a la máquina (migración 010_tracking_gps.sql)
export const imeiDeMaquina = (idMaquina: number) => `9${String(idMaquina).padStart(14, '0')}`;

// CRC-ITU (CRC-16/X-25): polinomio 0x1021 reflejado, inicio y XOR final 0xFFFF
const crcItu = (datos: number[]) => {
  let crc = 0xffff;
  for (const byte of datos) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = crc & 1 ? (crc >>> 1) ^ 0x8408 : crc >>> 1;
  }
  return ~crc & 0xffff;
};

const trama = (protocolo: number, contenido: number[], serie: number): number[] => {
  const cuerpo = [contenido.length + 5, protocolo, ...contenido, (serie >> 8) & 0xff, serie & 0xff];
  const crc = crcItu(cuerpo);
  return [0x78, 0x78, ...cuerpo, (crc >> 8) & 0xff, crc & 0xff, 0x0d, 0x0a];
};

const u32 = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];

// IMEI en BCD: 8 bytes con un 0 adelante
export const login = (imei: string, serie: number) => {
  const digitos = `0${imei}`;
  const bytes = Array.from({ length: 8 }, (_, i) => parseInt(digitos.slice(i * 2, i * 2 + 2), 16));
  return trama(PROTOCOLO_LOGIN, bytes, serie);
};

export interface DatosUbicacion {
  fechaHora: Date;
  latitud: number;
  longitud: number;
  velocidad: number | null;
  rumbo: number | null;
  // false: guardada sin señal y enviada después
  enTiempoReal: boolean;
}

// Ubicación 0x22: fecha UTC, satélites, latitud y longitud (grados × 1.800.000), velocidad, rumbo con el estado,
// datos de la celda (vacíos) y ACC, modo de envío y reenvío
export const ubicacion = (datos: DatosUbicacion, serie: number) => {
  const f = datos.fechaHora;
  const estado =
    0x1000 | // posicionado
    (datos.latitud >= 0 ? 0x0400 : 0) | // norte
    (datos.longitud < 0 ? 0x0800 : 0) | // oeste
    (Math.round(datos.rumbo ?? 0) % 360);
  const gps = [
    f.getUTCFullYear() - 2000, f.getUTCMonth() + 1, f.getUTCDate(), f.getUTCHours(), f.getUTCMinutes(), f.getUTCSeconds(),
    0xc8, // 12 bytes de GPS, 8 satélites (el teléfono no informa cuántos)
    ...u32(Math.round(Math.abs(datos.latitud) * 1_800_000)),
    ...u32(Math.round(Math.abs(datos.longitud) * 1_800_000)),
    Math.min(Math.max(Math.round(datos.velocidad ?? 0), 0), 255),
    estado >> 8, estado & 0xff,
  ];
  const celda = [0, 0, 0, 0, 0, 0, 0, 0];
  return trama(PROTOCOLO_UBICACION, [...gps, ...celda, 0x01, 0x00, datos.enTiempoReal ? 0 : 1], serie);
};

// Heartbeat con la batería del teléfono en niveles de 0 a 6 (0xFF si no se sabe)
export const heartbeat = (bateria: number | null, serie: number) => {
  const nivel = bateria === null ? 0xff : Math.round((Math.min(Math.max(bateria, 0), 100) / 100) * 6);
  return trama(PROTOCOLO_HEARTBEAT, [0x40, nivel, 0x04, 0x00, 0x02], serie);
};

// ACK del adaptador: 78 78 05 | protocolo | serie | CRC | 0D 0A. Devuelve los que vengan completos en los bytes
export const leerAcks = (bytes: ArrayLike<number>): { protocolo: number; serie: number }[] => {
  const acks: { protocolo: number; serie: number }[] = [];
  for (let i = 0; i + 10 <= bytes.length; i++) {
    if (bytes[i] !== 0x78 || bytes[i + 1] !== 0x78 || bytes[i + 2] !== 0x05) continue;
    acks.push({ protocolo: bytes[i + 3], serie: (bytes[i + 4] << 8) | bytes[i + 5] });
    i += 9;
  }
  return acks;
};
