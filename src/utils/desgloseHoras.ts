import { EstadoOperacional } from '../types/turno';

export interface TramoEstado {
  estado: Pick<EstadoOperacional, 'categoria'> & { esProductivo?: boolean };
  inicio: string; // ISO 8601
  fin: string | null; // null = estado vigente
}

export interface DesgloseHoras {
  totalMs: number;
  efectivasMs: number;
  demorasMs: number;
  mantencionMs: number;
  // Tiempo del turno sin ningún estado registrado (p. ej. antes de elegir el primero)
  sinEstadoMs: number;
}

// Estados guardados antes de que el catálogo trajera esProductivo se clasifican por categoría
const esEfectivo = (tramo: TramoEstado) => tramo.estado.esProductivo ?? tramo.estado.categoria === 'PRODUCTIVO';

/**
 * Desglose de horas del turno a partir de sus cambios de estado. Cada tramo se recorta al
 * intervalo [inicio del turno, ahora], de modo que efectivas + demoras + mantención + sin estado
 * siempre suman el total.
 */
export const calcularDesgloseHoras = (fechaInicioTurno: string, tramos: TramoEstado[], ahora: Date): DesgloseHoras => {
  const inicioTurno = new Date(fechaInicioTurno).getTime();
  const fin = ahora.getTime();
  const totalMs = Math.max(0, fin - inicioTurno);
  const desglose: DesgloseHoras = { totalMs, efectivasMs: 0, demorasMs: 0, mantencionMs: 0, sinEstadoMs: 0 };

  for (const tramo of tramos) {
    const desde = Math.max(new Date(tramo.inicio).getTime(), inicioTurno);
    const hasta = Math.min(tramo.fin ? new Date(tramo.fin).getTime() : fin, fin);
    const duracion = Math.max(0, hasta - desde);
    if (esEfectivo(tramo)) desglose.efectivasMs += duracion;
    else if (tramo.estado.categoria === 'MANTENCION') desglose.mantencionMs += duracion;
    else desglose.demorasMs += duracion;
  }

  const registrado = desglose.efectivasMs + desglose.demorasMs + desglose.mantencionMs;
  desglose.sinEstadoMs = Math.max(0, totalMs - registrado);
  return desglose;
};

export const formatearHoras = (ms: number) => `${(ms / 3_600_000).toFixed(1)} hrs`;
