import { useCallback } from 'react';
import { EventoHistorial, FiltroHistorial, listarHistorial, RangoHistorial } from '../services/historialService';
import { ElementoPaginado, PaginaLista, useListaPaginada } from './useListaPaginada';

// Historial paginado del jefe de turno (acciones sobre la flota y turnos de los operadores)
export const useHistorial = (filtro: FiltroHistorial, rango: RangoHistorial) => {
  const cargar = useCallback(
    async (r: RangoHistorial, ultimo?: ElementoPaginado): Promise<PaginaLista<EventoHistorial>> => {
      const pagina = await listarHistorial(filtro, r, ultimo);
      return { items: pagina.eventos, hayMas: pagina.hayMas };
    },
    [filtro],
  );
  return useListaPaginada<EventoHistorial, PaginaLista<EventoHistorial>>(cargar, filtro, rango);
};
