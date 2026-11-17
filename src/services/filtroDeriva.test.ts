import { crearFiltroDeriva, distanciaM, type Punto } from './filtroDeriva';

// Punto desplazado `norte` y `este` metros desde el origen (planta de Los Colorados)
const ORIGEN: Punto = { latitud: -28.2874, longitud: -70.8088 };
const a = (norte: number, este = 0): Punto => ({
  latitud: ORIGEN.latitud + norte / 111_195,
  longitud: ORIGEN.longitud + este / (111_195 * Math.cos((ORIGEN.latitud * Math.PI) / 180)),
});

describe('filtro de deriva', () => {
  it('acepta la primera lectura aunque sea imprecisa', () => {
    const filtro = crearFiltroDeriva();
    expect(filtro.registrar(ORIGEN, 80, null)).toEqual({ punto: ORIGEN, movida: true });
  });

  it('detenida, un salto de 40 m con buena precisión y sin velocidad no la mueve', () => {
    const filtro = crearFiltroDeriva();
    filtro.registrar(ORIGEN, 8, 0);
    expect(filtro.registrar(a(40), 8, 0.2)).toEqual({ punto: ORIGEN, movida: false });
    expect(filtro.registrar(a(-30, 25), 8, 0)).toEqual({ punto: ORIGEN, movida: false });
    expect(filtro.registrar(a(10, -45), 6, 0.1)).toEqual({ punto: ORIGEN, movida: false });
  });

  it('con velocidad de movimiento se mueve de inmediato', () => {
    const filtro = crearFiltroDeriva();
    filtro.registrar(ORIGEN, 8, 0);
    expect(filtro.registrar(a(120), 8, 4)).toEqual({ punto: a(120), movida: true });
  });

  it('una lectura imprecisa no la mueve aunque traiga velocidad', () => {
    const filtro = crearFiltroDeriva();
    filtro.registrar(ORIGEN, 8, 0);
    expect(filtro.registrar(a(120), 40, 4).movida).toBe(false);
  });

  it('si se movió y paró entre lecturas, se mueve al confirmarse el punto nuevo', () => {
    const filtro = crearFiltroDeriva();
    filtro.registrar(ORIGEN, 8, 0);
    expect(filtro.registrar(a(200), 8, 0).movida).toBe(false);
    expect(filtro.registrar(a(203, 2), 8, 0).movida).toBe(false);
    const confirmada = filtro.registrar(a(198, -3), 8, 0);
    expect(confirmada.movida).toBe(true);
    expect(distanciaM(confirmada.punto, a(200))).toBeLessThan(10);
  });

  it('una lectura junto al ancla descarta las candidatas', () => {
    const filtro = crearFiltroDeriva();
    filtro.registrar(ORIGEN, 8, 0);
    filtro.registrar(a(40), 8, 0);
    filtro.registrar(a(42), 8, 0);
    filtro.registrar(a(3), 8, 0);
    expect(filtro.registrar(a(41), 8, 0).movida).toBe(false);
  });

  it('al reiniciar acepta la primera lectura del turno siguiente', () => {
    const filtro = crearFiltroDeriva();
    filtro.registrar(ORIGEN, 8, 0);
    filtro.reiniciar();
    expect(filtro.registrar(a(500), 8, 0)).toEqual({ punto: a(500), movida: true });
  });
});
