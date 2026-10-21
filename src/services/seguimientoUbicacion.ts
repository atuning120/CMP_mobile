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
 * posición cada 2 minutos (también con la pantalla apagada, con una notificación fija de Android) y la manda
 * al adaptador como si fuera un LL301. Al terminar el turno se detiene.
 */

const TAREA_UBICACION = 'geoplanta-ubicacion-turno';
const INTERVALO_MS = 2 * 60 * 1000;
// Android puede entregar la ubicación algo antes de lo pedido
const MARGEN_MS = 15 * 1000;

let ultimaGuardada = 0;

// Máquina del turno en curso del operador con sesión en el teléfono, o null si no hay turno vigente
const maquinaEnTurno = async (): Promise<number | null> => {
  const idOperador = (await leerSesion())?.idOperador;
  if (!idOperador) return null;
  const [turno] = await listarTurnosEnCurso(idOperador);
  if (!turno || Date.now() > limiteCierreAutomatico(turno.fechaInicio).getTime()) return null;
  return turno.maquina.id;
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
  ultimaGuardada = ultima.timestamp;
  const { latitude, longitude, speed, heading } = ultima.coords;
  await guardarPosicion({
    idMaquina,
    fechaHora: new Date(ultima.timestamp).toISOString(),
    latitud: latitude,
    longitud: longitude,
    // m/s -> km/h; negativo o null cuando el teléfono no lo sabe
    velocidad: speed !== null && speed >= 0 ? speed * 3.6 : null,
    rumbo: heading !== null && heading >= 0 ? heading : null,
  });
  await enviarPosicionesPendientes();
});

const arrancar = async () => {
  if (await Location.hasStartedLocationUpdatesAsync(TAREA_UBICACION)) return;
  await Location.startLocationUpdatesAsync(TAREA_UBICACION, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: INTERVALO_MS,
    distanceInterval: 0,
    deferredUpdatesInterval: INTERVALO_MS,
    pausesUpdatesAutomatically: false,
    foregroundService: {
      notificationTitle: 'GeoPlanta: turno en curso',
      notificationBody: 'Enviando la ubicación de la máquina cada 2 minutos',
      killServiceOnDestroy: false,
    },
  });
};

// Android 11+ abre los ajustes para el permiso en segundo plano: antes se explica qué elegir
const explicarPermiso = () =>
  new Promise<void>((resolve) =>
    Alert.alert(
      'Ubicación durante el turno',
      'GeoPlanta enviará la ubicación de tu máquina cada 2 minutos mientras dure el turno, también con la pantalla apagada. En la siguiente pantalla elige "Permitir todo el tiempo".',
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
 * Al iniciar el turno: pide los permisos (si faltan) y empieza a enviar la ubicación. Sin permiso el turno sigue
 * igual; solo se avisa que la máquina no aparecerá en el mapa con su posición real.
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
  } catch (error) {
    console.warn('No se pudo activar el envío de ubicación:', error);
  }
};

export const detenerSeguimiento = async () => {
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
