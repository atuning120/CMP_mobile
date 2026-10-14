// Holgura sobre el tiempo transcurrido del turno: el horómetro redondea y el reloj del teléfono puede
// diferir unos minutos del de la máquina
export const MARGEN_HORAS = 0.5;

export type RevisionHorometro =
  | { tipo: 'vacio' }
  | { tipo: 'menor'; minimo: number }
  // excesivo: marca más horas de uso que las transcurridas desde el inicio del turno, lo que casi
  // siempre es un error de tipeo (p. ej. 12450 en vez de 1245.0) que inflaría las horas a pagar
  | { tipo: 'ok'; horasUso: number; horasTurno: number; excesivo: boolean };

/**
 * Revisa el horómetro final que escribió el operador contra el inicial y la duración del turno.
 */
export const revisarHorometroFinal = (
  texto: string,
  horometroInicial: number,
  fechaInicio: string,
  ahora: Date,
): RevisionHorometro => {
  const final = parseFloat(texto);
  if (texto === '' || isNaN(final)) return { tipo: 'vacio' };
  if (final < horometroInicial) return { tipo: 'menor', minimo: horometroInicial };
  const horasUso = final - horometroInicial;
  const horasTurno = Math.max(0, (ahora.getTime() - new Date(fechaInicio).getTime()) / 3_600_000);
  return { tipo: 'ok', horasUso, horasTurno, excesivo: horasUso > horasTurno + MARGEN_HORAS };
};

// 1234.5 → "1.234,5" (formato chileno, siempre con un decimal como el horómetro)
export const formatearHorometro = (valor: number) =>
  valor.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
