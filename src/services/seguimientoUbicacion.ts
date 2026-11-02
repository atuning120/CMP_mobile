import { Alert } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { guardarPosicion } from '../db/posicionLocal';
import { limiteCierreAutomatico, listarTurnosEnCurso } from '../db/turnoLocal';
import { getAdaptadorHost } from './adaptadorUrl';
import { leerSesion } from './authStorage';
import { enviarPosicionesPendientes } from './envioUbicacion';
import { mostrarAviso } from './retroalimentacion';

/*
 * Ubicación de la máquina durante el turno, mientras llegan los GPS LL301: el teléfono del operador toma su
 * posición cada 30 segundos con el GPS (también con la pantalla apagada, con una notificación fija de Android) y
 * la manda al adaptador como si fuera un LL301. Al iniciar y al finalizar el turno se manda una posición en el
 * momento, sin esperar al intervalo. Al terminar el turno se detiene.
 */

const TAREA_UBICACION = 'geoplanta-ubicacion-turno';
// Igual que el LL301: con 30 s una máquina no cruza una zona sin dejar posiciones dentro
const INTERVALO_MS = 30 * 1000;
// Android puede entregar la ubicación algo antes de lo pedido
const MARGEN_MS = 5 * 1000;
// Lectura en el momento (inicio y fin del turno): tope de espera al GPS; si no responde se usa la última posición
// conocida del teléfono, si no es más antigua que esto
const ESPERA_LECTURA_MS = 5 * 1000;
const ANTIGUEDAD_CONOCIDA_MS = 60 * 1000;

// Filtro de deriva (como el de los GPS vehiculares): detenido, cada lectura cae en otro punto de su círculo de error.
// Una lectura imprecisa (bajo techo o entre galpones) no mueve la máquina, y una precisa solo la mueve si se alejó
// claramente del punto anterior; si no, se repite ese punto (con la hora nueva, para que el mapa la vea vigente).
// La primera lectura del turno se acepta aunque sea imprecisa, para que la máquina aparezca de inmediato en el mapa;
// la primera lectura precisa que caiga lejos de ella la corrige
const PRECISION_MAXIMA_M = 25;
const DESPLAZAMIENTO_MINIMO_M = 15;

let ultimaGuardada = 0;
let ancla: { latitud: number; longitud: number } | null = null;

// Distancia en metros entre dos puntos cercanos (aproximación plana, suficiente dentro de una faena)
const distanciaM = (a: { latitud: number; longitud: number }, b: { latitud: number; longitud: number }) => {
  const radianes = Math.PI / 180;
  const x = (b.longitud - a.longitud) * radianes * Math.cos(((a.latitud + b.latitud) / 2) * radianes);
  const y = (b.latitud - a.latitud) * radianes;
  return Math.hypot(x, y) * 6_371_000;
};

// true si la lectura cuenta como movimiento real: precisa y más lejos del ancla que su propio margen de error
const seMovio = (punto: { latitud: number; longitud: number }, precision: number | null) => {
  if (!ancla) return true;
  if (precision !== null && precision > PRECISION_MAXIMA_M) return false;
  return distanciaM(ancla, punto) > Math.max(2 * (precision ?? 0), DESPLAZAMIENTO_MINIMO_M);
};

// Máquina del turno en curso del operador con sesión en el teléfono, o null si no hay turno vigente
const maquinaEnTurno = async (): Promise<number | null> => {
  const idOperador = (await leerSesion())?.idOperador;
  if (!idOperador) return null;
  const [turno] = await listarTurnosEnCurso(idOperador);
  if (!turno || Date.now() > limiteCierreAutomatico(turno.fechaInicio).getTime()) return null;
  return turno.maquina.id;
};

// Guarda una lectura del GPS para la máquina, pasada por el filtro de deriva. Ignora las que ya se guardaron
const registrarLectura = async (idMaquina: number, lectura: Location.LocationObject) => {
  if (lectura.timestamp <= ultimaGuardada) return;
  const { latitude, longitude, speed, heading, accuracy } = lectura.coords;
  const punto = { latitud: latitude, longitud: longitude };
  const movida = seMovio(punto, accuracy);
  if (movida) ancla = punto;
  ultimaGuardada = lectura.timestamp;
  await guardarPosicion({
    idMaquina,
    fechaHora: new Date(lectura.timestamp).toISOString(),
    ...(ancla ?? punto),
    // m/s -> km/h; negativo o null cuando el teléfono no lo sabe. Sin moverse, detenida y sin rumbo
    velocidad: !movida ? 0 : speed !== null && speed >= 0 ? speed * 3.6 : null,
    rumbo: movida && heading !== null && heading >= 0 ? heading : null,
  });
};

// Posición actual sin esperar a la tarea: la del GPS si llega a tiempo, si no la última conocida (si es reciente)
const leerAhora = async (): Promise<Location.LocationObject | null> => {
  const actual = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).catch(() => null);
  const espera = new Promise<null>((resolve) => setTimeout(() => resolve(null), ESPERA_LECTURA_MS));
  const lectura = await Promise.race([actual, espera]);
  return lectura ?? Location.getLastKnownPositionAsync({ maxAge: ANTIGUEDAD_CONOCIDA_MS }).catch(() => null);
};

// Lee y manda la posición en el momento, sin esperar al intervalo de 30 s
const enviarPosicionAhora = async (idMaquina: number) => {
  const lectura = await leerAhora();
  if (lectura) await registrarLectura(idMaquina, lectura);
  await enviarPosicionesPendientes();
};

// En el ámbito global (se importa desde src/app/_layout.tsx): Android puede arrancar la app en segundo plano
// solo para entregar ubicaciones, sin montar ninguna pantalla
TaskManager.defineTask<{ locations: Location.LocationObject[] }>(TAREA_UBICACION, async ({ data, error }) => {
  if (error || !data) return;
  const idMaquina = await maquinaEnTurno();
  if (idMaquina === null) {
    await detenerSeguimiento();
    return;
  }
  const ultima = data.locations.at(-1);
  if (!ultima || ultima.timestamp - ultimaGuardada < INTERVALO_MS - MARGEN_MS) return;
  await registrarLectura(idMaquina, ultima);
  await enviarPosicionesPendientes();
});

const arrancar = async () => {
  if (await Location.hasStartedLocationUpdatesAsync(TAREA_UBICACION)) return;
  await Location.startLocationUpdatesAsync(TAREA_UBICACION, {
    // Balanced usa wifi y antenas (error de ~100 m): no alcanza para distinguir las zonas de la planta
    accuracy: Location.Accuracy.High,
    timeInterval: INTERVALO_MS,
    distanceInterval: 0,
    deferredUpdatesInterval: INTERVALO_MS,
    pausesUpdatesAutomatically: false,
    foregroundService: {
      notificationTitle: 'GeoPlanta: turno en curso',
      notificationBody: 'Enviando la ubicación de la máquina cada 30 segundos',
      killServiceOnDestroy: false,
    },
  });
};

// Android 11+ abre los ajustes para el permiso en segundo plano: antes se explica qué elegir
const explicarPermiso = () =>
  new Promise<void>((resolve) =>
    Alert.alert(
      'Ubicación durante el turno',
      'GeoPlanta enviará la ubicación de tu máquina cada 30 segundos mientras dure el turno, también con la pantalla apagada. En la siguiente pantalla elige "Permitir todo el tiempo".',
      [{ text: 'Continuar', onPress: () => resolve() }],
      { cancelable: false },
    ),
  );

const pedirPermisos = async (): Promise<boolean> => {
  const primerPlano = await Location.requestForegroundPermissionsAsync();
  if (primerPlano.status !== 'granted') return false;
  if ((await Location.getBackgroundPermissionsAsync()).status === 'granted') return true;
  await explicarPermiso();
  return (await Location.requestBackgroundPermissionsAsync()).status === 'granted';
};

/**
 * Al iniciar el turno: pide los permisos (si faltan), manda la posición en el momento y sigue cada 30 s. Sin permiso
 * el turno sigue igual; solo se avisa que la máquina no aparecerá en el mapa con su posición real.
 */
export const activarSeguimiento = async () => {
  if (!getAdaptadorHost()) return;
  try {
    if (!(await pedirPermisos())) {
      mostrarAviso('Ubicación desactivada', {
        detalle: 'Tu máquina no aparecerá en el mapa. Actívala en Ajustes > Ubicación > Permitir todo el tiempo.',
        tipo: 'info',
      });
      return;
    }
    await arrancar();
    const idMaquina = await maquinaEnTurno();
    if (idMaquina !== null) await enviarPosicionAhora(idMaquina);
  } catch (error) {
    console.warn('No se pudo activar el envío de ubicación:', error);
  }
};

export const detenerSeguimiento = async () => {
  // El próximo turno puede empezar en otro lugar: no se repite el último punto de este
  ancla = null;
  try {
    if (await Location.hasStartedLocationUpdatesAsync(TAREA_UBICACION)) {
      await Location.stopLocationUpdatesAsync(TAREA_UBICACION);
    }
  } catch (error) {
    console.warn('No se pudo detener el envío de ubicación:', error);
  }
  // Lo que quedó sin enviar (p. ej. sin señal) se manda igual
  void enviarPosicionesPendientes();
};

/**
 * Al finalizar el turno desde la app: manda la última posición de la máquina y detiene el envío. Recibe la máquina
 * porque el turno ya quedó finalizado en el teléfono. Sin permiso de ubicación solo se detiene.
 */
export const finalizarSeguimiento = async (idMaquina: number) => {
  if (getAdaptadorHost()) {
    try {
      const lectura = await leerAhora();
      if (lectura) await registrarLectura(idMaquina, lectura);
    } catch (error) {
      console.warn('No se pudo leer la última ubicación del turno:', error);
    }
  }
  await detenerSeguimiento();
};

/**
 * Ajusta el envío al turno leído del teléfono: lo detiene si ya no hay turno (lo finalizó, lo cerró el jefe de
 * turno o se cerró solo) y lo reanuda si hay turno y el permiso ya estaba dado. Nunca pide permisos.
 */
export const sincronizarSeguimiento = async (hayTurno: boolean) => {
  if (!hayTurno) return detenerSeguimiento();
  if (!getAdaptadorHost()) return;
  try {
    if ((await Location.getBackgroundPermissionsAsync()).status === 'granted') await arrancar();
  } catch (error) {
    console.warn('No se pudo reanudar el envío de ubicación:', error);
  }
  void enviarPosicionesPendientes();
};
