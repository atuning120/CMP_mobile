import { useEffect, useMemo, useRef, useState } from 'react';
import { CambiosPendientesFlota, listarCambiosPendientesFlota } from '../services/accionesJefe';
import { suscribirCambioDatos } from '../sync/eventos';
import { buscar } from '../utils/busqueda';
import { useFlotaResumen } from './useFlotaResumen';

const SIN_CAMBIOS: CambiosPendientesFlota = { existentes: new Map(), nuevas: [], ids: [] };

/**
 * La flota del jefe de turno con lo que hizo sin señal y aún no llega al Backend: las máquinas se ven con sus cambios
 * aplicados (marcadas con `pendiente`) y las incorporadas sin señal aparecen primero. Cuando una acción se envía,
 * se recarga la flota para mostrar cómo quedó en el Backend.
 */
export const useFlotaConPendientes = (busqueda: string) => {
  const flota = useFlotaResumen(busqueda);
  const [pendientes, setPendientes] = useState<CambiosPendientesFlota>(SIN_CAMBIOS);
  const idsPendientes = useRef<number[]>([]);
  const { refetch } = flota;

  useEffect(() => {
    let activo = true;
    const leer = async () => {
      const actuales = await listarCambiosPendientesFlota().catch(() => null);
      if (!activo || !actuales) return;
      if (idsPendientes.current.some((id) => !actuales.ids.includes(id))) refetch();
      idsPendientes.current = actuales.ids;
      setPendientes(actuales);
    };
    void leer();
    const desuscribir = suscribirCambioDatos(() => void leer());
    return () => {
      activo = false;
      desuscribir();
    };
  }, [refetch]);

  const maquinas = useMemo(() => {
    if (pendientes.ids.length === 0) return flota.maquinas;
    const existentes = flota.maquinas.map((m) => pendientes.existentes.get(m.id)?.(m) ?? m);
    const nuevas = busqueda.trim() ? buscar(pendientes.nuevas, busqueda, (m) => `${m.codigo} ${m.patente} ${m.marcaModelo}`).map((r) => r.item) : pendientes.nuevas;
    return [...nuevas, ...existentes];
  }, [flota.maquinas, pendientes, busqueda]);

  return { ...flota, maquinas, contadorFlota: maquinas.length };
};
