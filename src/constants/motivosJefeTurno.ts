// Motivos que el jefe de turno elige al justificar una acción sobre la flota (quedan en la bitácora)
export const MOTIVOS_INCORPORACION = [
  'Aumento de capacidad',
  'Reemplazo de equipo',
  'Equipo nuevo de contratista',
  'Retorno desde mantención',
  'Otro',
];

export const MOTIVOS_EDICION = [
  'Corrección de datos',
  'Cambio de patente',
  'Actualización de ficha técnica',
  'Equipo en mantención',
  'Retorno desde mantención',
  'Otro',
];

// Al dejar una máquina fuera de servicio: el motivo se muestra en su tarjeta de la flota
export const MOTIVOS_DESHABILITAR = [
  'Falla mecánica',
  'Falla eléctrica',
  'Falla hidráulica',
  'Mantención programada',
  'Accidente o incidente',
  'Sin operador disponible',
  'Otro',
];

export const MOTIVOS_HABILITAR = ['Reparación finalizada', 'Retorno desde mantención', 'Operador disponible', 'Otro'];

export const MOTIVOS_OBSERVACION = [
  'Ruido o vibración anormal',
  'Fuga menor',
  'Alarma intermitente',
  'Reparación reciente en seguimiento',
  'Otro',
];

export const MOTIVOS_MANTENIMIENTO = [
  'Mantención programada',
  'Mantención correctiva',
  'Falla mecánica',
  'Falla eléctrica',
  'Falla hidráulica',
  'Otro',
];

export const MOTIVOS_RESERVA = ['Equipo de respaldo', 'Baja demanda operacional', 'Sin frente de trabajo asignado', 'Otro'];

// Al devolver la máquina original (vuelve de la reparación) y sacar a su respaldo
export const MOTIVOS_DEVOLUCION = ['Reparación finalizada', 'Mantención finalizada', 'Revisión aprobada', 'Otro'];

export const MOTIVOS_REEMPLAZO = [
  'Falla mecánica',
  'Falla eléctrica',
  'Falla hidráulica',
  'Mantención programada',
  'Accidente o incidente',
  'Renovación de equipo',
  'Fin de contrato (contratista)',
  'Otro',
];
