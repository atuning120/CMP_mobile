import { useMemo, useState } from 'react';
import { inicioDelDia, RangoHistorialUI, rangoPersonalizado, rangoPredefinido } from '../utils/historialFechas';

// Estado del filtro "Hoy / 7 días / 30 días / Personalizado" de las listas del jefe de turno
export const useRangoFechas = (inicial: RangoHistorialUI = '7 días') => {
  const [opcion, setOpcion] = useState<RangoHistorialUI>(inicial);
  // Días elegidos en "Personalizado" (inclusive); por defecto, hoy
  const [elegido, setElegido] = useState(() => ({ desde: inicioDelDia(new Date()), hasta: inicioDelDia(new Date()) }));
  const [modalVisible, setModalVisible] = useState(false);

  const rango = useMemo(
    () => (opcion === 'Personalizado' ? rangoPersonalizado(elegido.desde, elegido.hasta) : rangoPredefinido(opcion)),
    [opcion, elegido],
  );

  // Personalizado se aplica recién al confirmar las fechas en el modal
  const seleccionar = (nueva: RangoHistorialUI) => {
    if (nueva === 'Personalizado') setModalVisible(true);
    else setOpcion(nueva);
  };

  const aplicar = (desde: Date, hasta: Date) => {
    setElegido({ desde, hasta });
    setOpcion('Personalizado');
    setModalVisible(false);
  };

  return {
    opcion,
    elegido,
    rango,
    modalVisible,
    seleccionar,
    aplicar,
    abrirModal: () => setModalVisible(true),
    cerrarModal: () => setModalVisible(false),
  };
};

export type RangoFechasEstado = ReturnType<typeof useRangoFechas>;
