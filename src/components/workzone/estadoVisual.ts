import { createElement } from 'react';
import {
  Brush,
  CalendarCheck,
  CircleDot,
  ClipboardCheck,
  Clock,
  Coffee,
  Droplets,
  Fuel,
  HardHat,
  LucideIcon,
  Mountain,
  Play,
  Route,
  SatelliteDish,
  Shovel,
  Siren,
  Tractor,
  TriangleAlert,
  Truck,
  Users,
  Wrench,
} from 'lucide-react-native';
import { ThemeColors } from '../../constants/theme';
import { CategoriaEstado, EstadoOperacional } from '../../types/turno';

/*
 * Presentación de los estados operacionales: ícono según el tipo de actividad, color según la
 * categoría y el nombre corto (el catálogo usa "Categoría / Detalle").
 */

export const CATEGORIAS: { categoria: CategoriaEstado; titulo: string; ayuda: string }[] = [
  { categoria: 'PRODUCTIVO', titulo: 'Horas efectivas', ayuda: 'Suman como horas productivas del turno' },
  { categoria: 'DEMORA', titulo: 'Demoras operacionales', ayuda: 'Equipo detenido por causas operacionales' },
  { categoria: 'MANTENCION', titulo: 'Mantención y fallas', ayuda: 'Equipo detenido por fallas o mantención' },
];

export const etiquetaCategoria = (categoria: CategoriaEstado) =>
  CATEGORIAS.find((c) => c.categoria === categoria)?.titulo ?? categoria;

export const colorCategoria = (categoria: CategoriaEstado, theme: ThemeColors) =>
  categoria === 'PRODUCTIVO' ? theme.success : categoria === 'MANTENCION' ? theme.danger : theme.warning;

// "Demora / Colación y Descanso" -> "Colación y Descanso"
export const nombreCorto = (estado: EstadoOperacional) => (estado.nombre.split('/').slice(1).join('/').trim() || estado.nombre).trim();

const sinAcentos = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Palabras clave del nombre -> ícono; el primero que coincida gana
const ICONOS: [RegExp, LucideIcon][] = [
  [/carguio|excavacion/, Shovel],
  [/empuje|nivelacion/, Tractor],
  [/traslado de material/, Truck],
  [/traslado/, Route],
  [/talud|zanjado/, Mountain],
  [/limpieza/, Brush],
  [/relevo|cambio de turno/, Users],
  [/colacion|descanso/, Coffee],
  [/combustible|petroleo/, Fuel],
  [/inspeccion|pre-uso|pre-start/, ClipboardCheck],
  [/charla|seguridad/, HardHat],
  [/tronadura/, TriangleAlert],
  [/espera/, Clock],
  [/programad/, CalendarCheck],
  [/neumatico|oruga/, CircleDot],
  [/hidraulic/, Droplets],
  [/gps|telemetria/, SatelliteDish],
  [/siniestro|accidente|incidente/, Siren],
  [/falla|mantencion|mantenimiento/, Wrench],
];

const ICONO_CATEGORIA: Record<CategoriaEstado, LucideIcon> = {
  PRODUCTIVO: Play,
  DEMORA: Clock,
  MANTENCION: Wrench,
};

export const iconoEstado = (estado: EstadoOperacional): LucideIcon => {
  const nombre = sinAcentos(estado.nombre);
  return ICONOS.find(([patron]) => patron.test(nombre))?.[1] ?? ICONO_CATEGORIA[estado.categoria] ?? Clock;
};

// Componente estable (declarado fuera del render) que dibuja el ícono del estado
export const IconoEstado = ({ estado, size, color }: { estado: EstadoOperacional; size: number; color: string }) =>
  createElement(iconoEstado(estado), { size, color });
