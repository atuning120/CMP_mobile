import { useCallback } from 'react';
import { Alerta, EstadoAtencion, FiltroAlertas, listarAlertas } from '../services/alertasService';
import type { RangoHistorial } from '../services/historialService';
import { ElementoPaginado, PaginaLista, useListaPaginada } from './useListaPaginada';

type PaginaAlertasLista = PaginaLista<Alerta> & { activas: number };

// Alertas de turno paginadas, por tipo y por atención; `activas` (turnos abiertos hace más de 10 h) no depende del rango
export const useAlertas = (filtro: FiltroAlertas, estado: EstadoAtencion, rango: RangoHistorial) => {
  const cargar = useCallback(
    async (r: RangoHistorial, ultimo?: ElementoPaginado): Promise<PaginaAlertasLista> => {
      const pagina = await listarAlertas(filtro, estado, r, ultimo);
      return { items: pagina.alertas, hayMas: pagina.hayMas, activas: pagina.activas };
    },
    [filtro, estado],
  );
  const lista = useListaPaginada<Alerta, PaginaAlertasLista>(cargar, `${filtro}|${estado}`, rango);
  return { ...lista, activas: lista.ultimaPagina?.activas ?? null };
};
