import { ZonaTrabajo } from '../types/turno';
import { useCatalogo } from './useCatalogo';

export const useZonasPorArea = (idArea: number | null) => {
  const { items, ...rest } = useCatalogo<ZonaTrabajo>('zona', idArea !== null, idArea);
  return { zonas: items, ...rest };
};
