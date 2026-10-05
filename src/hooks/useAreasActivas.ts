import { useMemo } from 'react';
import { listarAreasActivas } from '../services/turnoService';
import { useRemoteList } from './useRemoteList';

export const useAreasActivas = (enabled: boolean) => {
  const fetcher = useMemo(() => (enabled ? listarAreasActivas : null), [enabled]);
  const { items, ...rest } = useRemoteList(fetcher);
  return { areas: items, ...rest };
};
