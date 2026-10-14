import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import * as Crypto from 'expo-crypto';

// Verificador de la contraseña para el login offline. Nunca se guarda la contraseña:
// solo un hash con salt aleatorio y estiramiento (SHA-256 iterado; expo-crypto no expone PBKDF2).
// El SHA-256 se calcula en JavaScript (@noble/hashes) y no con expo-crypto: mil llamadas await al
// módulo nativo, una tras otra, alargaban el login en el teléfono. El resultado es idéntico (hex en
// minúsculas del UTF-8), así que los verificadores ya guardados siguen siendo válidos.
export interface CredencialOffline {
  algoritmo: 'sha256-iterado';
  salt: string; // hex
  iteraciones: number;
  hash: string; // hex
}

const ITERACIONES = 1000;

const sha256Hex = (texto: string) => bytesToHex(sha256(utf8ToBytes(texto)));

const derivar = (identificador: string, password: string, salt: string, iteraciones: number) => {
  let hash = sha256Hex(`${salt}:${identificador}:${password}`);
  for (let i = 0; i < iteraciones; i++) {
    hash = sha256Hex(`${hash}${salt}`);
  }
  return hash;
};

// Comparación en tiempo constante para no filtrar cuántos caracteres coinciden
const igualesEnTiempoConstante = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
};

export const crearCredencialOffline = async (identificador: string, password: string): Promise<CredencialOffline> => {
  const salt = bytesToHex(await Crypto.getRandomBytesAsync(16));
  return {
    algoritmo: 'sha256-iterado',
    salt,
    iteraciones: ITERACIONES,
    hash: derivar(identificador, password, salt, ITERACIONES),
  };
};

export const verificarCredencialOffline = async (
  credencial: CredencialOffline,
  identificador: string,
  password: string,
): Promise<boolean> =>
  igualesEnTiempoConstante(derivar(identificador, password, credencial.salt, credencial.iteraciones), credencial.hash);
