import { useCallback, useEffect, useRef, useState } from 'react';
import type { RangoHistorial } from '../services/historialService';

export interface PaginaLista<T> {
  items: T[];
  hayMas: boolean;
}

// Elemento de una lista del jefe de turno: el cursor de paginación es (fecha, id) del último recibido
export interface ElementoPaginado {
  id: string;
  fecha: string;
}

export interface ListaPaginada<T, P> {
  items: T[];
  hayMas: boolean;
  // Última respuesta del Backend (para datos extra de la página, como el contador de alertas activas)
  ultimaPagina: P | null;
  isLoading: boolean;
  isLoadingMas: boolean;
  error: string | null;
  // Falló la carga de una página siguiente: los elementos ya cargados se mantienen
  errorMas: string | null;
  refetch: () => void;
  cargarMas: () => void;
}

const mensajeError = (err: unknown) => (err instanceof Error ? err.message : 'No se pudo cargar la información.');

/**
 * Lista paginada del más reciente al más antiguo dentro de un rango de fechas. La primera página se
 * recarga al cambiar `clave` (el filtro) o el rango, o con refetch; cargarMas pide la siguiente
 * (el scroll infinito la llama al acercarse al final).
 */
export const useListaPaginada = <T extends ElementoPaginado, P extends PaginaLista<T>>(
  cargar: (rango: RangoHistorial, ultimo?: ElementoPaginado) => Promise<P>,
  clave: string,
  rango: RangoHistorial,
): ListaPaginada<T, P> => {
  const [items, setItems] = useState<T[]>([]);
  const [hayMas, setHayMas] = useState(false);
  const [ultimaPagina, setUltimaPagina] = useState<P | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMas, setIsLoadingMas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorMas, setErrorMas] = useState<string | null>(null);
  const [recargas, setRecargas] = useState(0);
  // Identifica la consulta vigente: respuestas de un filtro o rango anterior se descartan
  const consultaRef = useRef(0);
  // El scroll dispara muchos eventos seguidos: el estado no alcanza a actualizarse entre uno y otro
  const cargandoMasRef = useRef(false);
  // La función puede cambiar en cada render: se usa siempre la última sin recargar por ello
  const cargarRef = useRef(cargar);
  useEffect(() => {
    cargarRef.current = cargar;
  });
  const { desde, hasta } = rango;

  useEffect(() => {
    const consulta = ++consultaRef.current;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      setErrorMas(null);
      try {
        const pagina = await cargarRef.current({ desde, hasta });
        if (consulta !== consultaRef.current) return;
        setItems(pagina.items);
        setHayMas(pagina.hayMas);
        setUltimaPagina(pagina);
      } catch (err) {
        if (consulta === consultaRef.current) setError(mensajeError(err));
      } finally {
        if (consulta === consultaRef.current) setIsLoading(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [clave, desde, hasta, recargas]);

  const refetch = useCallback(() => setRecargas((n) => n + 1), []);

  const cargarMas = useCallback(async () => {
    const ultimo = items[items.length - 1];
    if (!ultimo || !hayMas || isLoading || cargandoMasRef.current) return;
    const consulta = consultaRef.current;
    cargandoMasRef.current = true;
    setIsLoadingMas(true);
    setErrorMas(null);
    try {
      const pagina = await cargarRef.current({ desde, hasta }, ultimo);
      if (consulta !== consultaRef.current) return;
      setItems((prev) => [...prev, ...pagina.items.filter((e) => !prev.some((p) => p.id === e.id))]);
      setHayMas(pagina.hayMas);
      setUltimaPagina(pagina);
    } catch (err) {
      if (consulta === consultaRef.current) setErrorMas(mensajeError(err));
    } finally {
      cargandoMasRef.current = false;
      setIsLoadingMas(false);
    }
  }, [items, hayMas, isLoading, desde, hasta]);

  return { items, hayMas, ultimaPagina, isLoading, isLoadingMas, error, errorMas, refetch, cargarMas };
};
