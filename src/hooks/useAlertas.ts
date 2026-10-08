import { useCallback } from 'react';
import { Alerta, FiltroAlertas, listarAlertas } from '../services/alertasService';
import type { RangoHistorial } from '../services/historialService';
import { ElementoPaginado, PaginaLista, useListaPaginada } from './useListaPaginada';

type PaginaAlertasLista = PaginaLista<Alerta> & { activas: number };

// Alertas de turno paginadas; `activas` (turnos abiertos hace más de 10 h) no depende del rango
export const useAlertas = (filtro: FiltroAlertas, rango: RangoHistorial) => {
  const cargar = useCallback(
    async (r: RangoHistorial, ultimo?: ElementoPaginado): Promise<PaginaAlertasLista> => {
      const pagina = await listarAlertas(filtro, r, ultimo);
      return { items: pagina.alertas, hayMas: pagina.hayMas, activas: pagina.activas };
    },
    [filtro],
  );
  const lista = useListaPaginada<Alerta, PaginaAlertasLista>(cargar, filtro, rango);
  return { ...lista, activas: lista.ultimaPagina?.activas ?? null };
};
