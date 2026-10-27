// Holgura sobre el tiempo transcurrido del turno: el horómetro redondea y el reloj del teléfono puede
// diferir unos minutos del de la máquina
export const MARGEN_HORAS = 0.5;

export type RevisionHorometro =
  | { tipo: 'vacio' }
  | { tipo: 'menor'; minimo: number }
  // excesivo: marca más horas de uso que las transcurridas desde el inicio del turno, lo que casi
  // siempre es un error de tipeo (p. ej. 12450 en vez de 1245.0) que inflaría las horas a pagar.
  // bajo: marca menos horas de uso que las que la máquina estuvo operando según los estados del turno (el motor
  // tuvo que estar encendido): un error de tipeo o estados que no se actualizaron
  | { tipo: 'ok'; horasUso: number; horasTurno: number; horasEfectivas: number; excesivo: boolean; bajo: boolean };

/**
 * Revisa el horómetro final que escribió el operador contra el inicial, la duración del turno y las horas efectivas
 * (en estados productivos). Que marque menos que la duración no basta para advertir: en demoras y mantenciones el
 * motor puede estar apagado.
 */
export const revisarHorometroFinal = (
  texto: string,
  horometroInicial: number,
  fechaInicio: string,
  ahora: Date,
  horasEfectivas = 0,
): RevisionHorometro => {
  const final = parseFloat(texto);
  if (texto === '' || isNaN(final)) return { tipo: 'vacio' };
  if (final < horometroInicial) return { tipo: 'menor', minimo: horometroInicial };
  const horasUso = final - horometroInicial;
  const horasTurno = Math.max(0, (ahora.getTime() - new Date(fechaInicio).getTime()) / 3_600_000);
  return {
    tipo: 'ok',
    horasUso,
    horasTurno,
    horasEfectivas,
    excesivo: horasUso > horasTurno + MARGEN_HORAS,
    bajo: horasUso < horasEfectivas - MARGEN_HORAS,
  };
};

// 1234.5 → "1.234,5" (formato chileno, siempre con un decimal como el horómetro)
export const formatearHorometro = (valor: number) =>
  valor.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
