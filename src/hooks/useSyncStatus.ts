import { useEffect, useState } from 'react';
import { EstadoSincronizacion, obtenerEstadoSincronizacion, suscribirEstadoSincronizacion } from '../sync/eventos';

export const useSyncStatus = (): EstadoSincronizacion => {
  const [estado, setEstado] = useState(obtenerEstadoSincronizacion);
  useEffect(() => suscribirEstadoSincronizacion(setEstado), []);
  return estado;
};
