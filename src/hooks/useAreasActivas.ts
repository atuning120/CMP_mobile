import { Area } from '../types/turno';
import { useCatalogo } from './useCatalogo';

export const useAreasActivas = (enabled: boolean) => {
  const { items, ...rest } = useCatalogo<Area>('area', enabled);
  return { areas: items, ...rest };
};
