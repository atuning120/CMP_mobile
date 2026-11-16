import { heartbeat, imeiDeMaquina, leerAcks, login, ubicacion } from './gt06';

/*
 * Vectores fijos de las tramas GT06. Se generaron con el codificador del adaptador (../adaptador/src/gt06/codificador.ts),
 * que es contra el que se prueba el decodificador: si la app cambia un byte, el adaptador dejaría de entenderla y este
 * test falla. Si el cambio es intencional, actualizar ambos repos y regenerar los vectores con el codificador del adaptador.
 */

const hex = (bytes: number[]) => bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
const FECHA = new Date('2026-11-16T12:34:56Z');
const LOS_COLORADOS = { latitud: -28.3812, longitud: -70.8237 };

describe('gt06', () => {
  describe('imeiDeMaquina', () => {
    it('antepone 9 y completa a 15 dígitos', () => {
      expect(imeiDeMaquina(12)).toBe('900000000000012');
      expect(imeiDeMaquina(12345)).toBe('900000000012345');
      expect(imeiDeMaquina(12)).toHaveLength(15);
    });
  });

  describe('login', () => {
    it('coincide con el ejemplo del manual del protocolo GT06 (CRC 8CDD)', () => {
      expect(hex(login('123456789012345', 1))).toBe('78780d01012345678901234500018cdd0d0a');
    });

    it('codifica el IMEI virtual de una máquina igual que el adaptador', () => {
      expect(hex(login(imeiDeMaquina(12), 7))).toBe('78780d0109000000000000120007be1c0d0a');
    });
  });

  describe('ubicacion', () => {
    it('codifica una posición en tiempo real (hemisferio sur y oeste) igual que el adaptador', () => {
      const trama = ubicacion({ fechaHora: FECHA, ...LOS_COLORADOS, velocidad: 42.6, rumbo: 187, enTiempoReal: true }, 258);
      expect(hex(trama)).toBe('787822221a0b100c2238c8030b835007993b242b18bb00000000000000000100000102ba940d0a');
    });

    it('marca como reenvío la posición guardada sin señal y trata velocidad y rumbo nulos como 0', () => {
      const trama = ubicacion({ fechaHora: FECHA, ...LOS_COLORADOS, velocidad: null, rumbo: null, enTiempoReal: false }, 65535);
      expect(hex(trama)).toBe('787822221a0b100c2238c8030b835007993b240018000000000000000000010001ffff32350d0a');
    });

    it('acota la velocidad al rango de un byte', () => {
      // Byte 19: cabecera (4) + fecha (6) + satélites (1) + latitud (4) + longitud (4)
      const conVelocidad = (velocidad: number) =>
        ubicacion({ fechaHora: FECHA, ...LOS_COLORADOS, velocidad, rumbo: 0, enTiempoReal: true }, 1)[19];
      expect(conVelocidad(-5)).toBe(0);
      expect(conVelocidad(400)).toBe(255);
    });
  });

  describe('heartbeat', () => {
    it('convierte la batería al nivel 0 a 6 igual que el adaptador', () => {
      expect(hex(heartbeat(85, 3))).toBe('78780a1340050400020003fdcd0d0a');
    });

    it('usa 0xFF si no se conoce la batería y acota valores fuera de rango', () => {
      expect(heartbeat(null, 1)[5]).toBe(0xff);
      expect(heartbeat(150, 1)[5]).toBe(6);
      expect(heartbeat(-10, 1)[5]).toBe(0);
    });
  });

  describe('leerAcks', () => {
    const ack = (protocolo: number, serie: number) => [0x78, 0x78, 0x05, protocolo, serie >> 8, serie & 0xff, 0x00, 0x00, 0x0d, 0x0a];

    it('lee varios ACK seguidos en el mismo bloque de bytes', () => {
      expect(leerAcks([...ack(0x01, 1), ...ack(0x13, 300)])).toEqual([
        { protocolo: 0x01, serie: 1 },
        { protocolo: 0x13, serie: 300 },
      ]);
    });

    it('ignora basura previa y un ACK incompleto al final', () => {
      expect(leerAcks([0x00, 0x42, ...ack(0x01, 2), ...ack(0x13, 3).slice(0, 6)])).toEqual([{ protocolo: 0x01, serie: 2 }]);
    });
  });
});
