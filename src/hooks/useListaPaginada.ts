import { useCallback, useEffect, useRef, useState } from 'react';
import type { RangoHistorial } from '../services/historialService';
import { guardarConsulta, leerConsulta } from '../db/consultaLocal';
import { diasIncluidos } from '../utils/historialFechas';
import { mensajeDeError } from '../utils/errores';

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
  // Se muestra la primera página guardada en el teléfono (aún no se confirma con el Backend): cuándo se recibió
  guardadoEn: string | null;
  // Falló la carga de una página siguiente: los elementos ya cargados se mantienen
  errorMas: string | null;
  refetch: () => void;
  cargarMas: () => void;
  // Cambia un elemento ya cargado sin volver a pedir la lista (p. ej. una alerta recién atendida)
  actualizar: (id: string, cambio: (item: T) => T) => void;
}

const mensajeError = (err: unknown) => (mensajeDeError(err, 'No se pudo cargar la información.'));

// "7 días" sigue siendo la misma consulta al día siguiente, aunque su fecha de inicio cambie
const claveRango = ({ desde, hasta }: RangoHistorial) => hasta ?? `ultimos-${diasIncluidos(new Date(desde), new Date())}`;

/**
 * Lista paginada del más reciente al más antiguo dentro de un rango de fechas. La primera página se
 * recarga al cambiar `clave` (el filtro) o el rango, o con refetch; cargarMas pide la siguiente
 * (el scroll infinito la llama al acercarse al final).
 *
 * La primera página se guarda en el teléfono (`prefijoCache` + filtro + rango): al volver a pedirla se muestra
 * lo guardado mientras responde el Backend, y si no responde (sin señal) queda a la vista con `guardadoEn`.
 */
export const useListaPaginada = <T extends ElementoPaginado, P extends PaginaLista<T>>(
  cargar: (rango: RangoHistorial, ultimo?: ElementoPaginado) => Promise<P>,
  clave: string,
  rango: RangoHistorial,
  prefijoCache: string,
): ListaPaginada<T, P> => {
  const [items, setItems] = useState<T[]>([]);
  const [hayMas, setHayMas] = useState(false);
  const [ultimaPagina, setUltimaPagina] = useState<P | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMas, setIsLoadingMas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorMas, setErrorMas] = useState<string | null>(null);
  const [guardadoEn, setGuardadoEn] = useState<string | null>(null);
  const [recargas, setRecargas] = useState(0);
  // Consulta cuyos datos están a la vista y cuándo se recibieron (del Backend o de la copia local)
  const claveMostradaRef = useRef<string | null>(null);
  const recibidoEnRef = useRef<string | null>(null);
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
    const claveCache = `${prefijoCache}|${clave}|${claveRango({ desde, hasta })}`;
    const mostrar = (pagina: P, recibidoEn: string) => {
      setItems(pagina.items);
      setHayMas(pagina.hayMas);
      setUltimaPagina(pagina);
      claveMostradaRef.current = claveCache;
      recibidoEnRef.current = recibidoEn;
    };
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      setErrorMas(null);
      // Otro filtro o rango: se muestra al instante lo guardado (si hay) mientras responde el Backend
      if (claveMostradaRef.current !== claveCache) {
        const guardada = await leerConsulta<P>(claveCache).catch(() => null);
        if (consulta !== consultaRef.current) return;
        if (guardada) mostrar(guardada.datos, guardada.guardadoEn);
        setGuardadoEn(guardada?.guardadoEn ?? null);
      }
      try {
        const pagina = await cargarRef.current({ desde, hasta });
        if (consulta !== consultaRef.current) return;
        mostrar(pagina, new Date().toISOString());
        setGuardadoEn(null);
        guardarConsulta(claveCache, pagina).catch((e) => console.warn('No se pudo guardar la consulta', e));
      } catch (err) {
        if (consulta !== consultaRef.current) return;
        setError(mensajeError(err));
        if (claveMostradaRef.current === claveCache) {
          // Lo que está a la vista queda marcado como no actualizado
          setGuardadoEn(recibidoEnRef.current);
        } else {
          // No hay nada de esta consulta: no se dejan a la vista los datos de otro filtro
          setItems([]);
          setHayMas(false);
        }
      } finally {
        if (consulta === consultaRef.current) setIsLoading(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [clave, desde, hasta, recargas, prefijoCache]);

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

  const actualizar = useCallback((id: string, cambio: (item: T) => T) => {
    setItems((prev) => prev.map((item) => (item.id === id ? cambio(item) : item)));
  }, []);

  return { items, hayMas, ultimaPagina, isLoading, isLoadingMas, error, guardadoEn, errorMas, refetch, cargarMas, actualizar };
};
