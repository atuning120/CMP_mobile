import { useCallback, useEffect, useRef, useState } from 'react';
import { EventoHistorial, FiltroHistorial, listarHistorial, RangoHistorial } from '../services/historialService';

export interface UseHistorialResult {
  eventos: EventoHistorial[];
  hayMas: boolean;
  isLoading: boolean;
  isLoadingMas: boolean;
  error: string | null;
  // Falló la carga de una página siguiente: los eventos ya cargados se mantienen
  errorMas: string | null;
  refetch: () => void;
  cargarMas: () => void;
}

const mensajeError = (err: unknown) => (err instanceof Error ? err.message : 'No se pudo cargar el historial.');

// Historial paginado: la primera página se recarga al cambiar el filtro o el rango, o con refetch;
// cargarMas pide la siguiente (el scroll infinito la llama al acercarse al final)
export const useHistorial = (filtro: FiltroHistorial, rango: RangoHistorial): UseHistorialResult => {
  const [eventos, setEventos] = useState<EventoHistorial[]>([]);
  const [hayMas, setHayMas] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMas, setIsLoadingMas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorMas, setErrorMas] = useState<string | null>(null);
  const [recargas, setRecargas] = useState(0);
  // Identifica la consulta vigente: respuestas de un filtro o rango anterior se descartan
  const consultaRef = useRef(0);
  // El scroll dispara muchos eventos seguidos: el estado no alcanza a actualizarse entre uno y otro
  const cargandoMasRef = useRef(false);
  const { desde, hasta } = rango;

  useEffect(() => {
    const consulta = ++consultaRef.current;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      setErrorMas(null);
      try {
        const pagina = await listarHistorial(filtro, { desde, hasta });
        if (consulta !== consultaRef.current) return;
        setEventos(pagina.eventos);
        setHayMas(pagina.hayMas);
      } catch (err) {
        if (consulta === consultaRef.current) setError(mensajeError(err));
      } finally {
        if (consulta === consultaRef.current) setIsLoading(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [filtro, desde, hasta, recargas]);

  const refetch = useCallback(() => setRecargas((n) => n + 1), []);

  const cargarMas = useCallback(async () => {
    const ultimo = eventos[eventos.length - 1];
    if (!ultimo || !hayMas || isLoading || cargandoMasRef.current) return;
    const consulta = consultaRef.current;
    cargandoMasRef.current = true;
    setIsLoadingMas(true);
    setErrorMas(null);
    try {
      const pagina = await listarHistorial(filtro, { desde, hasta }, ultimo);
      if (consulta !== consultaRef.current) return;
      setEventos((prev) => [...prev, ...pagina.eventos.filter((e) => !prev.some((p) => p.id === e.id))]);
      setHayMas(pagina.hayMas);
    } catch (err) {
      if (consulta === consultaRef.current) setErrorMas(mensajeError(err));
    } finally {
      cargandoMasRef.current = false;
      setIsLoadingMas(false);
    }
  }, [eventos, hayMas, isLoading, filtro, desde, hasta]);

  return { eventos, hayMas, isLoading, isLoadingMas, error, errorMas, refetch, cargarMas };
};
