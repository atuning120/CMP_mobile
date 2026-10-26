import { useCallback, useEffect, useState } from 'react';
import { getStoredToken } from '../services/authStorage';
import { sincronizarSesion } from '../services/authService';

/**
 * Access token para cargar recursos protegidos fuera de apiRequest, como las fotos de evidencia con expo-image
 * (que solo envían los headers que se les dan). Si una carga falla porque el token venció, renovar() renueva la
 * sesión (una sola renovación aunque la pidan varias fotos a la vez) y entrega el token nuevo.
 */
export function useTokenSesion() {
  const [token, setToken] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let activo = true;
    getStoredToken().then((leido) => {
      if (!activo) return;
      setToken(leido);
      setListo(true);
    });
    return () => {
      activo = false;
    };
  }, []);

  const renovar = useCallback(async () => {
    if ((await sincronizarSesion()) !== 'ok') return false;
    setToken(await getStoredToken());
    return true;
  }, []);

  return { token, listo, renovar };
}
