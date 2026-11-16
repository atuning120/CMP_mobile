import type { OperacionPendiente, TipoOperacion } from './colaSync';
import { describirOperacion, HORAS_CONFIRMACION, HORAS_VENCIMIENTO, tramoDe } from './vigenciaAcciones';

const AHORA = new Date('2026-11-16T12:00:00Z').getTime();
const haceHoras = (horas: number) => new Date(AHORA - horas * 60 * 60 * 1000).toISOString();

const operacion = (cambios: Partial<OperacionPendiente> = {}): OperacionPendiente => ({
  id: 1,
  tipo: 'EDITAR_MAQUINA',
  idEntidad: 'maquina:5',
  idOperador: 0,
  usuario: 'jefe1@cmp.cl',
  claveBloqueo: 'maquina:5',
  fechaAccion: haceHoras(1),
  payload: {},
  estado: 'PENDIENTE',
  intentos: 0,
  ultimoError: null,
  codigoError: null,
  ...cambios,
});

describe('tramoDe', () => {
  it('usa los plazos de negocio de 24 h y 72 h', () => {
    expect(HORAS_CONFIRMACION).toBe(24);
    expect(HORAS_VENCIMIENTO).toBe(72);
  });

  it.each([
    [0, 'VIGENTE'],
    [24, 'VIGENTE'], // el límite exacto todavía se envía
    [24.01, 'POR_CONFIRMAR'],
    [72, 'POR_CONFIRMAR'],
    [72.01, 'VENCIDA'],
    [500, 'VENCIDA'],
  ])('una acción del jefe de turno de hace %p h está %s', (horas, tramo) => {
    expect(tramoDe(operacion({ fechaAccion: haceHoras(horas) }), AHORA)).toBe(tramo);
  });

  it('envía sin pedir de nuevo una acción de más de 24 h que el jefe de turno ya confirmó', () => {
    expect(tramoDe(operacion({ fechaAccion: haceHoras(30), payload: { confirmada: true } }), AHORA)).toBe('VIGENTE');
  });

  it('descarta una acción confirmada si igual pasó las 72 h', () => {
    expect(tramoDe(operacion({ fechaAccion: haceHoras(80), payload: { confirmada: true } }), AHORA)).toBe('VENCIDA');
  });

  it('nunca vence la atención de una alerta', () => {
    expect(tramoDe(operacion({ tipo: 'ATENDER_ALERTA', fechaAccion: haceHoras(500) }), AHORA)).toBe('VIGENTE');
  });

  it('no aplica a las operaciones del operador (sin usuario ni fecha de la acción)', () => {
    expect(tramoDe(operacion({ tipo: 'REGISTRAR_ESTADO', usuario: null, idOperador: 7, fechaAccion: null }), AHORA)).toBe('VIGENTE');
    expect(tramoDe(operacion({ fechaAccion: null }), AHORA)).toBe('VIGENTE');
  });
});

describe('describirOperacion', () => {
  const describir = (tipo: TipoOperacion, payload: Record<string, unknown>) => describirOperacion(operacion({ tipo, payload }));

  it('describe un cambio de estado con la etiqueta que ve el jefe de turno', () => {
    expect(describir('EDITAR_MAQUINA', { codigo: 'CF-05', datos: { estado: 'EN_MANTENIMIENTO' } })).toBe(
      'Cambio de estado de CF-05 a En mantenimiento',
    );
  });

  it('lista los campos editados en palabras y omite los internos', () => {
    expect(describir('EDITAR_MAQUINA', { codigo: 'CF-05', datos: { marca: 'X', anio: 2020, versionBase: 3 } })).toBe(
      'Edición de CF-05 (marca, año)',
    );
  });

  it('nombra la máquina por su id cuando no tiene código', () => {
    expect(describir('CERRAR_TURNO', { idMaquina: 9, operador: 'Operador 1' })).toBe('Cierre del turno de Operador 1 en la máquina #9');
  });

  it('describe la incorporación de una máquina con su código normalizado', () => {
    expect(describir('CREAR_MAQUINA', { datos: { nombre: ' cf-10 ' } })).toBe('Incorporación de CF-10');
    expect(describir('CREAR_MAQUINA', { datos: {} })).toBe('Incorporación de una máquina');
  });

  it('describe alertas y horómetros', () => {
    expect(describir('ATENDER_ALERTA', { resumen: 'CF-05' })).toBe('Atención de la alerta de CF-05');
    expect(describir('ATENDER_ALERTA', {})).toBe('Atención de una alerta');
    expect(describir('REGULARIZAR_HOROMETRO', { resumen: 'CF-05', horometroFinal: 1234.5 })).toBe(
      'Regularización del horómetro de CF-05: 1234.5 h',
    );
  });
});
