import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alerta, EstadoAtencion, FiltroAlertas, listarAlertas } from '../services/alertasService';
import { AtencionPendiente, listarAtencionesPendientes } from '../services/accionesJefe';
import type { RangoHistorial } from '../services/historialService';
import { suscribirCambioDatos } from '../sync/eventos';
import { ElementoPaginado, PaginaLista, useListaPaginada } from './useListaPaginada';

type PaginaAlertasLista = PaginaLista<Alerta> & { activas: number };

/**
 * Alertas de turno paginadas, por tipo y por atención; `activas` (turnos abiertos hace más de 10 h) no depende del rango.
 * Las atenciones hechas sin señal se muestran en su alerta hasta que llegan al Backend; entonces se recarga la lista.
 */
export const useAlertas = (filtro: FiltroAlertas, estado: EstadoAtencion, rango: RangoHistorial) => {
  const cargar = useCallback(
    async (r: RangoHistorial, ultimo?: ElementoPaginado): Promise<PaginaAlertasLista> => {
      const pagina = await listarAlertas(filtro, estado, r, ultimo);
      return { items: pagina.alertas, hayMas: pagina.hayMas, activas: pagina.activas };
    },
    [filtro, estado],
  );
  const lista = useListaPaginada<Alerta, PaginaAlertasLista>(cargar, `${filtro}|${estado}`, rango, 'alertas');

  const [pendientes, setPendientes] = useState<AtencionPendiente[]>([]);
  const idsPendientes = useRef<number[]>([]);
  const { refetch } = lista;
  useEffect(() => {
    let activo = true;
    const leer = async () => {
      const actuales = await listarAtencionesPendientes().catch(() => null);
      if (!activo || !actuales) return;
      const ids = actuales.map((p) => p.atencion.pendiente!.idOperacion);
      // Una que ya no está en la cola se envió (o se descartó): la lista del Backend trae cómo quedó
      if (idsPendientes.current.some((id) => !ids.includes(id))) refetch();
      idsPendientes.current = ids;
      setPendientes(actuales);
    };
    void leer();
    const desuscribir = suscribirCambioDatos(() => void leer());
    return () => {
      activo = false;
      desuscribir();
    };
  }, [refetch]);

  const items = useMemo(
    () =>
      pendientes.length === 0
        ? lista.items
        : lista.items.map((alerta) => {
            const propias = pendientes.filter((p) => p.idAlerta === alerta.id).map((p) => p.atencion);
            return propias.length && alerta.atenciones ? { ...alerta, atenciones: [...alerta.atenciones, ...propias] } : alerta;
          }),
    [lista.items, pendientes],
  );

  return { ...lista, items, activas: lista.ultimaPagina?.activas ?? null };
};
