import { Maquina } from '../types/turno';
import { useCatalogo } from './useCatalogo';

export const useMaquinasActivas = (enabled: boolean) => {
  const { items, ...rest } = useCatalogo<Maquina>('maquina', enabled);
  return { maquinas: items, ...rest };
};
