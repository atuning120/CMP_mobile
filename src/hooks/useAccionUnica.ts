import { useCallback, useRef, useState } from 'react';

/**
 * Evita que una acción se ejecute dos veces por toques repetidos (p. ej. el operador presiona varias
 * veces "Iniciar turno" mientras carga). El bloqueo es inmediato gracias a la ref: un estado de React
 * recién se aplica en el siguiente render, y dos toques rápidos alcanzaban a pasar antes de que el
 * botón se deshabilitara. `ocupado` sirve para deshabilitar el botón y mostrar el indicador de carga.
 *
 * Uso: const [guardando, ejecutarUnaVez] = useAccionUnica();
 *      const guardar = () => ejecutarUnaVez(async () => { ... });
 */
export const useAccionUnica = () => {
  const enCurso = useRef(false);
  const [ocupado, setOcupado] = useState(false);

  const ejecutarUnaVez = useCallback(async (accion: () => Promise<unknown> | unknown) => {
    if (enCurso.current) return;
    enCurso.current = true;
    setOcupado(true);
    try {
      await accion();
    } finally {
      enCurso.current = false;
      setOcupado(false);
    }
  }, []);

  return [ocupado, ejecutarUnaVez] as const;
};

// Para navegaciones: bloquea los toques repetidos mientras la pantalla nueva aparece
export const esperarTransicion = () => new Promise<void>((resolver) => setTimeout(resolver, 700));
