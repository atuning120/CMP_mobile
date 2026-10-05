import * as Crypto from 'expo-crypto';

// Verificador de la contraseña para el login offline. Nunca se guarda la contraseña:
// solo un hash con salt aleatorio y estiramiento (SHA-256 iterado; expo-crypto no expone PBKDF2).
export interface CredencialOffline {
  algoritmo: 'sha256-iterado';
  salt: string; // hex
  iteraciones: number;
  hash: string; // hex
}

const ITERACIONES = 1000;

const bytesAHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

const derivar = async (identificador: string, password: string, salt: string, iteraciones: number) => {
  let hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${identificador}:${password}`);
  for (let i = 0; i < iteraciones; i++) {
    hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${hash}${salt}`);
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
  const salt = bytesAHex(await Crypto.getRandomBytesAsync(16));
  return {
    algoritmo: 'sha256-iterado',
    salt,
    iteraciones: ITERACIONES,
    hash: await derivar(identificador, password, salt, ITERACIONES),
  };
};

export const verificarCredencialOffline = async (
  credencial: CredencialOffline,
  identificador: string,
  password: string,
): Promise<boolean> =>
  igualesEnTiempoConstante(await derivar(identificador, password, credencial.salt, credencial.iteraciones), credencial.hash);
