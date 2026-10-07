import { useEffect, useState } from 'react';
import { listarModelosMaquina } from '../services/flotaService';
import type { PlantillaEquipo } from '../components/supervisor/EquipoDataForm';

// Modelos genéricos ("Datos Previos") para pre-cargar el formulario de una máquina nueva.
// Se piden al abrir el modal; si falla, se reintenta la próxima vez que se abra.
export const useModelosMaquina = (habilitado: boolean) => {
  const [plantillas, setPlantillas] = useState<PlantillaEquipo[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    if (!habilitado || cargado) return;
    let cancelado = false;
    const timer = setTimeout(async () => {
      setCargando(true);
      setError(null);
      try {
        const modelos = await listarModelosMaquina();
        if (cancelado) return;
        setPlantillas(
          modelos.map((m) => ({ id: String(m.idModelo), nombreCorto: m.nombre, marca: m.marca, modelo: m.modelo, tipoMaquina: m.tipoMaquina })),
        );
        setCargado(true);
      } catch (err) {
        if (!cancelado) setError(err instanceof Error ? err.message : 'No se pudieron cargar los modelos.');
      } finally {
        if (!cancelado) setCargando(false);
      }
    }, 0);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [habilitado, cargado]);

  return { plantillas, cargando, error };
};
