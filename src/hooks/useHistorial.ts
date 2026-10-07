import { useCallback, useEffect, useRef, useState } from 'react';
import { EventoHistorial, FiltroHistorial, listarHistorial } from '../services/historialService';

export interface UseHistorialResult {
  eventos: EventoHistorial[];
  hayMas: boolean;
  isLoading: boolean;
  isLoadingMas: boolean;
  error: string | null;
  refetch: () => void;
  cargarMas: () => void;
}

// Historial paginado: la primera página se recarga al cambiar el filtro o con refetch; cargarMas pide la siguiente
export const useHistorial = (filtro: FiltroHistorial): UseHistorialResult => {
  const [eventos, setEventos] = useState<EventoHistorial[]>([]);
  const [hayMas, setHayMas] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMas, setIsLoadingMas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recargas, setRecargas] = useState(0);
  // Identifica la consulta vigente: respuestas de un filtro anterior se descartan
  const consultaRef = useRef(0);

  useEffect(() => {
    const consulta = ++consultaRef.current;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const pagina = await listarHistorial(filtro);
        if (consulta !== consultaRef.current) return;
        setEventos(pagina.eventos);
        setHayMas(pagina.hayMas);
      } catch (err) {
        if (consulta === consultaRef.current) setError(err instanceof Error ? err.message : 'No se pudo cargar el historial.');
      } finally {
        if (consulta === consultaRef.current) setIsLoading(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [filtro, recargas]);

  const refetch = useCallback(() => setRecargas((n) => n + 1), []);

  const cargarMas = useCallback(async () => {
    const ultimo = eventos[eventos.length - 1];
    if (!ultimo || !hayMas || isLoadingMas) return;
    const consulta = consultaRef.current;
    setIsLoadingMas(true);
    try {
      const pagina = await listarHistorial(filtro, ultimo.fecha);
      if (consulta !== consultaRef.current) return;
      setEventos((prev) => [...prev, ...pagina.eventos.filter((e) => !prev.some((p) => p.id === e.id))]);
      setHayMas(pagina.hayMas);
    } catch (err) {
      if (consulta === consultaRef.current) setError(err instanceof Error ? err.message : 'No se pudo cargar el historial.');
    } finally {
      setIsLoadingMas(false);
    }
  }, [eventos, hayMas, isLoadingMas, filtro]);

  return { eventos, hayMas, isLoading, isLoadingMas, error, refetch, cargarMas };
};
