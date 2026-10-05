import { useMemo } from 'react';
import { listarMaquinasActivas } from '../services/turnoService';
import { useRemoteList } from './useRemoteList';

export const useMaquinasActivas = (enabled: boolean) => {
  const fetcher = useMemo(() => (enabled ? listarMaquinasActivas : null), [enabled]);
  const { items, ...rest } = useRemoteList(fetcher);
  return { maquinas: items, ...rest };
};
