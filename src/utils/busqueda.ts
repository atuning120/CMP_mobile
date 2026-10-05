// Búsqueda difusa basada en expresiones regulares para listas cortas (áreas, zonas, máquinas).
// Ignora mayúsculas y acentos, acepta palabras en cualquier orden, letras salteadas
// ("chcdor" → "Chancador") y errores de tipeo leves ("chancadro" → "Chancador").

export type RangoCoincidencia = [inicio: number, fin: number];

export interface ResultadoBusqueda<T> {
  item: T;
  puntaje: number;
  // Tramos del texto original que coinciden, para resaltarlos en la UI
  rangos: RangoCoincidencia[];
}

const SEPARADORES = String.raw`\s\-–—_/().,:;`;

const escaparRegExp = (texto: string) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Normaliza carácter a carácter para conservar los índices del texto original (necesario para resaltar)
export const normalizar = (texto: string) =>
  texto
    .split('')
    .map((caracter) => caracter.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().charAt(0) || caracter)
    .join('');

const distanciaEdicion = (a: string, b: string, maximo: number): number => {
  if (Math.abs(a.length - b.length) > maximo) return maximo + 1;
  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const actual = [i];
    let minimoFila = i;
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      actual[j] = Math.min(anterior[j] + 1, actual[j - 1] + 1, anterior[j - 1] + costo);
      minimoFila = Math.min(minimoFila, actual[j]);
    }
    if (minimoFila > maximo) return maximo + 1;
    anterior = actual;
  }
  return anterior[b.length];
};

const unirRangos = (rangos: RangoCoincidencia[]): RangoCoincidencia[] => {
  const ordenados = [...rangos].sort((a, b) => a[0] - b[0]);
  const unidos: RangoCoincidencia[] = [];
  for (const rango of ordenados) {
    const ultimo = unidos[unidos.length - 1];
    if (ultimo && rango[0] <= ultimo[1]) {
      ultimo[1] = Math.max(ultimo[1], rango[1]);
    } else {
      unidos.push([rango[0], rango[1]]);
    }
  }
  return unidos;
};

const evaluar = (texto: string, frase: string, tokens: string[]): Omit<ResultadoBusqueda<never>, 'item'> | null => {
  const fraseRegExp = escaparRegExp(frase);

  // 1. El texto comienza con la búsqueda
  if (new RegExp(`^${fraseRegExp}`).test(texto)) {
    return { puntaje: 100, rangos: [[0, frase.length]] };
  }

  // 2. Alguna palabra del texto comienza con la búsqueda
  const inicioPalabra = new RegExp(`(^|[${SEPARADORES}])(${fraseRegExp})`).exec(texto);
  if (inicioPalabra) {
    const inicio = inicioPalabra.index + inicioPalabra[1].length;
    return { puntaje: 80 - inicio / 100, rangos: [[inicio, inicio + frase.length]] };
  }

  // 3. La búsqueda aparece en cualquier parte del texto
  const contenida = texto.search(new RegExp(fraseRegExp));
  if (contenida >= 0) {
    return { puntaje: 60 - contenida / 100, rangos: [[contenida, contenida + frase.length]] };
  }

  // 4. Todas las palabras buscadas aparecen, en cualquier orden
  if (tokens.length > 1) {
    const rangos: RangoCoincidencia[] = [];
    let alInicioDePalabra = 0;
    const todas = tokens.every((token) => {
      const match = new RegExp(`(^|[${SEPARADORES}])?(${escaparRegExp(token)})`).exec(texto);
      if (!match) return false;
      const inicio = match.index + (match[1]?.length ?? 0);
      if (match[1] !== undefined) alInicioDePalabra++;
      rangos.push([inicio, inicio + token.length]);
      return true;
    });
    if (todas) {
      return { puntaje: 40 + (alInicioDePalabra / tokens.length) * 10, rangos: unirRangos(rangos) };
    }
  }

  // 5. Letras en orden con saltos ("chcdor" → "chancador"); se penalizan los saltos largos
  const compacta = tokens.join('');
  if (compacta.length >= 2) {
    const patron = compacta.split('').map((caracter) => `(${escaparRegExp(caracter)})`).join('.*?');
    const match = new RegExp(patron).exec(texto);
    if (match) {
      const rangos: RangoCoincidencia[] = [];
      let cursor = match.index;
      for (let i = 1; i < match.length; i++) {
        const posicion = texto.indexOf(match[i], cursor);
        rangos.push([posicion, posicion + 1]);
        cursor = posicion + 1;
      }
      const extension = cursor - match.index;
      const densidad = compacta.length / extension;
      // Exigir una densidad mínima evita coincidencias absurdas en textos largos
      if (densidad >= 0.35) {
        return { puntaje: 20 + densidad * 10, rangos: unirRangos(rangos) };
      }
    }
  }

  // 6. Errores de tipeo: cada palabra buscada se parece a alguna palabra del texto
  const palabras = [...texto.matchAll(new RegExp(`[^${SEPARADORES}]+`, 'g'))];
  const rangos: RangoCoincidencia[] = [];
  const parecidas = tokens.every((token) => {
    if (token.length < 4) return false;
    const tolerancia = token.length >= 7 ? 2 : 1;
    // Se compara contra prefijos de la palabra para aceptar búsquedas incompletas con error ("chamc" → "chancador")
    const palabra = palabras.find((p) => {
      for (let largo = token.length - tolerancia; largo <= token.length + tolerancia; largo++) {
        if (largo > 0 && largo <= p[0].length && distanciaEdicion(token, p[0].slice(0, largo), tolerancia) <= tolerancia) {
          return true;
        }
      }
      return false;
    });
    if (!palabra) return false;
    rangos.push([palabra.index!, palabra.index! + palabra[0].length]);
    return true;
  });
  if (parecidas && tokens.length > 0) {
    return { puntaje: 10, rangos: unirRangos(rangos) };
  }

  return null;
};

/**
 * Filtra y ordena `items` por similitud con `consulta`. Con consulta vacía devuelve todo en el orden original.
 */
export const buscar = <T>(items: T[], consulta: string, obtenerTexto: (item: T) => string): ResultadoBusqueda<T>[] => {
  const frase = normalizar(consulta).trim().replace(/\s+/g, ' ');
  if (!frase) {
    return items.map((item) => ({ item, puntaje: 0, rangos: [] }));
  }
  const tokens = frase.split(' ');

  return items
    .map((item, indice) => {
      const resultado = evaluar(normalizar(obtenerTexto(item)), frase, tokens);
      return resultado ? { item, indice, ...resultado } : null;
    })
    .filter((resultado): resultado is ResultadoBusqueda<T> & { indice: number } => resultado !== null)
    .sort((a, b) => b.puntaje - a.puntaje || a.indice - b.indice)
    .map(({ item, puntaje, rangos }) => ({ item, puntaje, rangos }));
};
