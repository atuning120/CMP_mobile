import type { RangoHistorial } from '../services/historialService';

export const RANGOS_HISTORIAL = ['Hoy', '7 días', '30 días', 'Personalizado'] as const;
export type RangoHistorialUI = (typeof RANGOS_HISTORIAL)[number];

// Igual que el Backend: un rango más largo se rechaza
export const DIAS_MAXIMOS_HISTORIAL = 90;

export const inicioDelDia = (fecha: Date) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

export const sumarDias = (fecha: Date, dias: number) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias);

// Días calendario entre dos fechas, contando ambos extremos (hoy a hoy = 1)
export const diasIncluidos = (desde: Date, hasta: Date) =>
  Math.round((inicioDelDia(hasta).getTime() - inicioDelDia(desde).getTime()) / (24 * 60 * 60 * 1000)) + 1;

// Rangos de días completos en hora local: "7 días" son hoy y los 6 anteriores
export const rangoPredefinido = (opcion: Exclude<RangoHistorialUI, 'Personalizado'>): RangoHistorial => {
  const dias = opcion === 'Hoy' ? 1 : opcion === '7 días' ? 7 : 30;
  return { desde: sumarDias(new Date(), -(dias - 1)).toISOString(), hasta: null };
};

// Personalizado: del inicio del primer día al inicio del día siguiente al último (hasta es exclusiva)
export const rangoPersonalizado = (desde: Date, hasta: Date): RangoHistorial => ({
  desde: inicioDelDia(desde).toISOString(),
  hasta: sumarDias(hasta, 1).toISOString(),
});

const formatoCorto = (fecha: Date) => fecha.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });

// "06/10 – 08/10" o "06/10" si es un solo día
export const etiquetaRango = (desde: Date, hasta: Date) =>
  diasIncluidos(desde, hasta) === 1 ? formatoCorto(desde) : `${formatoCorto(desde)} – ${formatoCorto(hasta)}`;

// "Hoy", "Ayer" o "Lunes 06/10"
const etiquetaDia = (dia: Date) => {
  const hoy = inicioDelDia(new Date());
  if (dia.getTime() === hoy.getTime()) return 'Hoy';
  if (dia.getTime() === sumarDias(hoy, -1).getTime()) return 'Ayer';
  const semana = dia.toLocaleDateString('es-CL', { weekday: 'long' });
  return `${semana.charAt(0).toUpperCase()}${semana.slice(1)} ${formatoCorto(dia)}`;
};

export interface DiaHistorial<T> {
  clave: string;
  titulo: string;
  eventos: T[];
}

// Los eventos vienen del más reciente al más antiguo: basta con cortar cuando cambia el día
export const agruparPorDia = <T extends { fecha: string }>(eventos: T[]): DiaHistorial<T>[] => {
  const dias: DiaHistorial<T>[] = [];
  for (const evento of eventos) {
    const dia = inicioDelDia(new Date(evento.fecha));
    const clave = dia.toISOString();
    const ultimo = dias[dias.length - 1];
    if (ultimo?.clave === clave) ultimo.eventos.push(evento);
    else dias.push({ clave, titulo: etiquetaDia(dia), eventos: [evento] });
  }
  return dias;
};

// "hace 5 min", "hace 3 h", "ayer 14:30" o "05/10 14:30"
export const formatearFecha = (iso: string) => {
  const fecha = new Date(iso);
  const minutos = Math.floor((Date.now() - fecha.getTime()) / 60000);
  const hora = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  if (minutos < 1) return 'recién';
  if (minutos < 60) return `hace ${minutos} min`;
  if (minutos < 12 * 60) return `hace ${Math.floor(minutos / 60)} h`;
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  if (fecha.toDateString() === new Date().toDateString()) return `hoy ${hora}`;
  if (fecha.toDateString() === ayer.toDateString()) return `ayer ${hora}`;
  return `${fecha.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })} ${hora}`;
};

// "45 min" o "10 h 20 min"
export const formatearDuracion = (minutos: number) => {
  const horas = Math.floor(minutos / 60);
  const resto = Math.floor(minutos % 60);
  if (horas === 0) return `${resto} min`;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
};
