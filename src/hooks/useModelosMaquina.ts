import { useEffect, useState } from 'react';
import { listarModelosMaquina } from '../services/flotaService';
import type { PlantillaEquipo } from '../components/supervisor/EquipoDataForm';
import { mensajeDeError } from '../utils/errores';
import { consultarConCopia } from '../db/consultaLocal';

// Modelos genéricos ("Datos Previos") para pre-cargar el formulario de una máquina nueva.
// Se recargan cada vez que se abre el modal: al incorporar una máquina de un tipo nuevo se agrega un modelo.
// Sin señal, los últimos recibidos.
export const useModelosMaquina = (habilitado: boolean) => {
  const [plantillas, setPlantillas] = useState<PlantillaEquipo[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!habilitado) return;
    let cancelado = false;
    const timer = setTimeout(async () => {
      setCargando(true);
      setError(null);
      try {
        const modelos = await consultarConCopia('catalogo|modelos', listarModelosMaquina);
        if (cancelado) return;
        setPlantillas(
          modelos.map((m) => ({ id: String(m.idModelo), nombreCorto: m.nombre, marca: m.marca, modelo: m.modelo, tipoMaquina: m.tipoMaquina })),
        );
      } catch (err) {
        if (!cancelado) setError(mensajeDeError(err, 'No se pudieron cargar los modelos.'));
      } finally {
        if (!cancelado) setCargando(false);
      }
    }, 0);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [habilitado]);

  return { plantillas, cargando, error };
};
