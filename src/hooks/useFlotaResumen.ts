import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { listarFlota, type CrearMaquinaApi, MaquinaFlotaApi } from '../services/flotaService';
import { conRegreso, EstadoMaquina, presentacionEstado } from '../constants/estadosMaquina';
import { guardarConsulta, leerConsulta } from '../db/consultaLocal';
import { buscar } from '../utils/busqueda';
import { mensajeDeError } from '../utils/errores';

export interface MaquinaFlota {
  id: number;
  codigo: string;
  patente: string;
  marcaModelo: string;
  // Datos de la ficha tal como están en el Backend (para editarla)
  marca: string;
  modelo: string;
  tipoMaquina: string;
  anio: number | null;
  numeroChasis: string | null;
  esContratista: boolean;
  estado: EstadoMaquina;
  // Motivo del estado actual (si no está operativa)
  motivoEstado: string | null;
  // Nadie la tiene asignada ni la está operando: se muestra junto al estado
  sinOperador: boolean;
  idOperadorAsignado: number | null;
  operadorAsignado: string | null; // a cargo de la máquina
  operadorEnTurno: string | null; // con turno en curso (puede ser otro, p. ej. en un relevo)
  idTurnoActual: number | null; // ese turno: es el que cierra el jefe de turno (null si vino de un Backend anterior)
  zonaActual: string | null;
  horometroActual: number;
  combustible: { porcentaje: number; tipo: string } | null;
  // En mantenimiento o fuera de servicio: cuándo se espera que vuelva (ISO)
  regresoEstimado: string | null;
  // Tras un reemplazo: quién la cubre (y a qué estado vuelve al devolver) o, en el respaldo, a quién cubre
  respaldo: { id: number; codigo: string; estadoAlDevolver: EstadoMaquina } | null;
  cubreA: { id: number; codigo: string } | null;
  // Versión en el Backend: se envía como versionBase al modificarla (null si vino de un Backend anterior)
  version: number | null;
  // Tiene acciones del jefe de turno hechas sin señal que aún no llegan al Backend (se muestra con ellas aplicadas).
  // clave: la de sus operaciones en la cola; error: por qué el servidor rechazó la primera; porConfirmar: alguna tiene más
  // de 24 h y espera que el jefe de turno la confirme; nueva: incorporada sin señal
  pendiente?: { clave: string; error: string | null; porConfirmar: boolean; nueva: boolean } | null;
}

export interface UseFlotaResumenResult {
  maquinas: MaquinaFlota[];
  contadorFlota: number;
  isLoading: boolean;
  error: Error | null;
  // Se muestra la flota guardada en el teléfono (aún no se confirma con el Backend): cuándo se recibió
  guardadoEn: string | null;
  refetch: () => void;
  actualizarMaquina: (maquina: MaquinaFlota) => void;
}

// Espera tras la última tecla antes de consultar al Backend
const DEBOUNCE_BUSQUEDA_MS = 300;

// Se guarda la flota completa; una búsqueda sin señal se resuelve sobre ella en el teléfono
const CLAVE_CACHE = 'flota';

const textoBusqueda = (m: MaquinaFlota) =>
  [m.codigo, m.patente, m.marcaModelo, m.operadorAsignado, m.operadorEnTurno, m.zonaActual].filter(Boolean).join(' ');

const leerFlotaGuardada = async (busqueda: string) => {
  const guardada = await leerConsulta<MaquinaFlotaApi[]>(CLAVE_CACHE).catch(() => null);
  if (!guardada) return null;
  const todas = guardada.datos.map(mapMaquinaFlota);
  const maquinas = busqueda.trim() ? buscar(todas, busqueda, textoBusqueda).map((r) => r.item) : todas;
  return { maquinas, guardadoEn: guardada.guardadoEn };
};

const componerMarcaModelo = (marca: string | null, modelo: string | null, tipoMaquina: string | null) =>
  [[marca, modelo].filter(Boolean).join(' '), tipoMaquina].filter(Boolean).join(' · ');

// TODO: el combustible aún no existe en la base de datos
export const mapMaquinaFlota = (maquina: MaquinaFlotaApi): MaquinaFlota => ({
  id: maquina.idMaquina,
  codigo: maquina.nombre,
  patente: maquina.patente ?? '',
  marcaModelo: componerMarcaModelo(maquina.marca, maquina.modelo, maquina.tipoMaquina),
  marca: maquina.marca ?? '',
  modelo: maquina.modelo ?? '',
  tipoMaquina: maquina.tipoMaquina ?? '',
  anio: maquina.anio,
  numeroChasis: maquina.numeroChasis,
  esContratista: maquina.esContratista,
  estado: presentacionEstado(maquina.estado).valor,
  // Motivo con que pasó a su estado actual (y su observación, si la hay)
  motivoEstado: maquina.motivoEstado
    ? [
        maquina.motivoEstado.motivo +
          (maquina.motivoEstado.reemplazadaPor ? ` · reemplazada por ${maquina.motivoEstado.reemplazadaPor}` : ''),
        maquina.motivoEstado.observacion,
      ]
        .filter(Boolean)
        .join(': ')
    : null,
  sinOperador: !maquina.operadorAsignado && !maquina.operadorActual,
  idOperadorAsignado: maquina.operadorAsignado?.idOperador ?? null,
  operadorAsignado: maquina.operadorAsignado?.nombre ?? null,
  operadorEnTurno: maquina.operadorActual,
  idTurnoActual: maquina.idTurnoActual ?? null,
  zonaActual: maquina.ubicacionActual,
  horometroActual: maquina.horometroActual ?? 0,
  combustible: null,
  regresoEstimado: maquina.regresoEstimado ?? null,
  respaldo: maquina.respaldo
    ? { id: maquina.respaldo.idMaquina, codigo: maquina.respaldo.nombre, estadoAlDevolver: presentacionEstado(maquina.respaldo.estadoAlDevolver).valor }
    : null,
  cubreA: maquina.cubreA ? { id: maquina.cubreA.idMaquina, codigo: maquina.cubreA.nombre } : null,
  version: maquina.version ?? null,
});

// La máquina con los cambios de una acción aún no enviada (recalcula lo que se deriva de ellos)
export const conCambios = (maquina: MaquinaFlota, vista: Partial<MaquinaFlota>): MaquinaFlota => {
  const cambiada = { ...maquina, ...vista };
  return {
    ...cambiada,
    marcaModelo: componerMarcaModelo(cambiada.marca, cambiada.modelo, cambiada.tipoMaquina),
    sinOperador: !cambiada.operadorAsignado && !cambiada.operadorEnTurno,
  };
};

// Cómo se ve una máquina incorporada sin señal mientras no llega al Backend (id: uno negativo que no choca con los reales)
export const vistaDeNueva = (id: number, datos: CrearMaquinaApi, operadorAsignado: string | null): MaquinaFlota => ({
  id,
  codigo: datos.nombre.trim().toUpperCase(),
  patente: (datos.patente ?? '').trim().toUpperCase(),
  marcaModelo: componerMarcaModelo(datos.marca, datos.modelo, datos.tipoMaquina),
  marca: datos.marca,
  modelo: datos.modelo,
  tipoMaquina: datos.tipoMaquina,
  anio: datos.anio,
  numeroChasis: datos.numeroChasis,
  esContratista: datos.esContratista,
  estado: 'ACTIVA',
  motivoEstado: null,
  sinOperador: datos.idOperador === null,
  idOperadorAsignado: datos.idOperador,
  operadorAsignado,
  operadorEnTurno: null,
  idTurnoActual: null,
  zonaActual: null,
  horometroActual: datos.horometroInicial,
  combustible: null,
  regresoEstimado: null,
  respaldo: null,
  cubreA: null,
  version: null,
});

// Pasó su regreso estimado y sigue sin volver a operar: el jefe de turno debe hacer seguimiento
export const regresoVencido = (maquina: MaquinaFlota, ahora: number = Date.now()) =>
  !!maquina.regresoEstimado &&
  conRegreso(maquina.estado) &&
  new Date(maquina.regresoEstimado).getTime() <= ahora;

export const useFlotaResumen = (busqueda: string): UseFlotaResumenResult => {
  const [maquinas, setMaquinas] = useState<MaquinaFlota[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [guardadoEn, setGuardadoEn] = useState<string | null>(null);
  const [recargas, setRecargas] = useState(0);
  // Búsqueda cuyos resultados están a la vista y cuándo se recibieron (del Backend o de la copia local)
  const busquedaMostradaRef = useRef<string | null>(null);
  const recibidoEnRef = useRef<string | null>(null);

  useEffect(() => {
    // Solo marca la consulta como obsoleta: fetchBackend maneja su propio timeout
    const controlador = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      const mostrar = (lista: MaquinaFlota[], recibidoEn: string) => {
        setMaquinas(lista);
        busquedaMostradaRef.current = busqueda;
        recibidoEnRef.current = recibidoEn;
      };
      // Otra búsqueda: se muestra al instante lo guardado (si hay) mientras responde el Backend
      if (busquedaMostradaRef.current !== busqueda) {
        const guardada = await leerFlotaGuardada(busqueda);
        if (controlador.signal.aborted) return;
        if (guardada) mostrar(guardada.maquinas, guardada.guardadoEn);
        setGuardadoEn(guardada?.guardadoEn ?? null);
      }
      try {
        const respuesta = await listarFlota(busqueda);
        if (controlador.signal.aborted) return;
        mostrar(respuesta.map(mapMaquinaFlota), new Date().toISOString());
        setGuardadoEn(null);
        if (!busqueda.trim()) {
          guardarConsulta(CLAVE_CACHE, respuesta).catch((e) => console.warn('No se pudo guardar la flota', e));
        }
      } catch (err) {
        // Una búsqueda más nueva reemplazó a esta: se descarta su resultado
        if (controlador.signal.aborted) return;
        setError(new Error(mensajeDeError(err, 'No se pudo cargar la flota.')));
        // Lo que está a la vista queda marcado como no actualizado; sin nada de esta búsqueda se muestra el error
        if (busquedaMostradaRef.current === busqueda) setGuardadoEn(recibidoEnRef.current);
        else setMaquinas([]);
      } finally {
        if (!controlador.signal.aborted) setIsLoading(false);
      }
    }, DEBOUNCE_BUSQUEDA_MS);
    return () => {
      clearTimeout(timer);
      controlador.abort();
    };
  }, [busqueda, recargas]);

  const refetch = useCallback(() => setRecargas((n) => n + 1), []);

  // Reemplaza en la lista una máquina ya guardada en el Backend (sin recargar toda la flota)
  const actualizarMaquina = useCallback((maquinaActualizada: MaquinaFlota) => {
    setMaquinas((prev) => prev.map((m) => (m.id === maquinaActualizada.id ? maquinaActualizada : m)));
  }, []);

  const contadorFlota = useMemo(() => maquinas.length, [maquinas]);

  return { maquinas, contadorFlota, isLoading, error, guardadoEn, refetch, actualizarMaquina };
};
