import { useKeepAwake } from 'expo-keep-awake';

/**
 * Mientras está montado, la pantalla no se apaga sola. Se monta solo con un turno en curso: el operador
 * suele dejar el teléfono en el soporte de la cabina y, si la pantalla se bloquea, tiene que
 * desbloquearla (con guantes) cada vez que cambia de estado. Android lo aplica solo con la app en primer
 * plano: al salir de la app o al bloquear con el botón, el teléfono vuelve a su comportamiento normal.
 */
export const PantallaEncendida = () => {
  // Sin la opción, Android lanza un error no controlado si la pantalla ya no está activa al desmontar
  useKeepAwake('turno-en-curso', { suppressDeactivateWarnings: true });
  return null;
};
