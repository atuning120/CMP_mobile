import { useEffect, useState } from 'react';
import type { RegistroAccion } from '../db/registroAcciones';
import { type AccionEnBandeja, listarBandeja } from '../services/accionesJefe';
import { suscribirCambioDatos } from '../sync/eventos';

/**
 * Bandeja del jefe de turno: lo que hizo sin señal y aún no llega al Backend (separado en lo que necesita su decisión
 * y lo que solo espera conexión) y el registro de lo que se descartó. Se actualiza sola con cada cambio de la cola.
 */
export const useAccionesPendientes = () => {
  const [acciones, setAcciones] = useState<AccionEnBandeja[]>([]);
  const [registro, setRegistro] = useState<RegistroAccion[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    const leer = async () => {
      const bandeja = await listarBandeja().catch(() => null);
      if (!activo) return;
      if (bandeja) {
        setAcciones(bandeja.acciones);
        setRegistro(bandeja.registro);
      }
      setCargando(false);
    };
    void leer();
    const desuscribir = suscribirCambioDatos(() => void leer());
    return () => {
      activo = false;
      desuscribir();
    };
  }, []);

  return {
    // Rechazadas por el servidor o con más de 24 h: el jefe de turno decide
    porRevisar: acciones.filter((a) => a.estado !== 'PENDIENTE'),
    // Esperan conexión (o a otra de la misma máquina que está detenida)
    enEspera: acciones.filter((a) => a.estado === 'PENDIENTE'),
    registro,
    cargando,
  };
};
