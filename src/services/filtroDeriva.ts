/*
 * Filtro de deriva (como el de los GPS vehiculares): detenido, cada lectura cae en otro punto de su círculo de error.
 * La máquina queda en su "ancla" y solo se mueve con una lectura que:
 * - sea precisa: una imprecisa (bajo techo o entre galpones) nunca la mueve;
 * - caiga claramente lejos del ancla, más allá de su propio margen de error;
 * - y además venga en movimiento según la velocidad del GPS. La velocidad sale del efecto Doppler y casi no deriva
 *   detenido, a diferencia de la posición: entre galpones Android informa una precisión de 8 m con lecturas que caen
 *   a 40 m. Si la lectura no trae velocidad, o la máquina se movió y paró entre dos lecturas, el cambio se acepta
 *   cuando LECTURAS_CONFIRMACION lecturas seguidas caen en el mismo punto nuevo (un salto de deriva no se repite).
 * La primera lectura se acepta aunque sea imprecisa, para que la máquina aparezca de inmediato en el mapa.
 */

export type Punto = { latitud: number; longitud: number };

export const PRECISION_MAXIMA_M = 25;
export const DESPLAZAMIENTO_MINIMO_M = 15;
// 1 m/s = 3,6 km/h: detenido, la velocidad Doppler del teléfono queda bajo ~0,5 m/s
export const VELOCIDAD_MOVIMIENTO_MS = 1;
// Con lecturas cada 30 s, una máquina que se movió y quedó detenida aparece en su lugar nuevo en ~1 minuto
export const LECTURAS_CONFIRMACION = 3;

// Distancia en metros entre dos puntos cercanos (aproximación plana, suficiente dentro de una faena)
export const distanciaM = (a: Punto, b: Punto) => {
  const radianes = Math.PI / 180;
  const x = (b.longitud - a.longitud) * radianes * Math.cos(((a.latitud + b.latitud) / 2) * radianes);
  const y = (b.latitud - a.latitud) * radianes;
  return Math.hypot(x, y) * 6_371_000;
};

export const crearFiltroDeriva = () => {
  let ancla: Punto | null = null;
  // Lecturas seguidas lejos del ancla y cerca entre sí: posible lugar nuevo de la máquina detenida
  let candidatas: Punto[] = [];

  return {
    /**
     * Pasa una lectura por el filtro y devuelve dónde queda la máquina y si se movió.
     * precision en metros y velocidad en m/s; null si el teléfono no las sabe.
     */
    registrar(punto: Punto, precision: number | null, velocidad: number | null): { punto: Punto; movida: boolean } {
      const movida = this.seMovio(punto, precision, velocidad);
      if (movida) {
        ancla = punto;
        candidatas = [];
      }
      return { punto: ancla ?? punto, movida };
    },

    seMovio(punto: Punto, precision: number | null, velocidad: number | null): boolean {
      if (!ancla) return true;
      if (precision !== null && precision > PRECISION_MAXIMA_M) return false;
      const margen = Math.max(2 * (precision ?? 0), DESPLAZAMIENTO_MINIMO_M);
      if (distanciaM(ancla, punto) <= margen) {
        // Volvió a caer junto al ancla: lo de antes era deriva
        candidatas = [];
        return false;
      }
      if (velocidad !== null && velocidad >= VELOCIDAD_MOVIMIENTO_MS) return true;
      candidatas = candidatas.every((c) => distanciaM(c, punto) <= margen) ? [...candidatas, punto] : [punto];
      return candidatas.length >= LECTURAS_CONFIRMACION;
    },

    // El próximo turno puede empezar en otro lugar: no se repite el último punto de este
    reiniciar() {
      ancla = null;
      candidatas = [];
    },
  };
};
