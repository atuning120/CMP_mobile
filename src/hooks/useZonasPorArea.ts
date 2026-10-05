import { useMemo } from 'react';
import { listarZonasPorArea } from '../services/turnoService';
import { useRemoteList } from './useRemoteList';

export const useZonasPorArea = (idArea: number | null) => {
  const fetcher = useMemo(() => (idArea !== null ? () => listarZonasPorArea(idArea) : null), [idArea]);
  const { items, ...rest } = useRemoteList(fetcher);
  return { zonas: items, ...rest };
};
