import { getDb, leerAjuste } from '../db/database';
import { leerCatalogo } from '../db/catalogoLocal';
import { listarRegistroAcciones } from '../db/registroAcciones';
import { listarEvidencias, listarTurnosEnCurso, obtenerTurno } from '../db/turnoLocal';
import type { MaquinaFlota } from '../hooks/useFlotaResumen';
import { cerrarTurnoJefe, editarMaquinaJefe, nuevaAccion } from '../services/accionesJefe';
import { ApiError, apiRequest } from '../services/apiClient';
import { leerSesion, type SesionGuardada } from '../services/authStorage';
import type { EditarMaquinaApi } from '../services/flotaService';
import { adjuntarFoto, FotoNoEncontradaError } from '../services/fotos';
import { cambiarEstadoOperacional, finalizarTurno, iniciarTurno } from '../services/operacionesTurno';
import { mostrarAviso } from '../services/retroalimentacion';
import type { EstadoOperacional, IniciarTurnoDatos, Maquina } from '../types/turno';
import { contarOperaciones, listarTodasLasOperaciones } from './colaSync';
import { actualizarEstadoSincronizacion, obtenerEstadoSincronizacion } from './eventos';
import { AVISO_CIERRE_JEFE, sincronizacionEnCurso, sincronizar } from './syncEngine';

/*
 * Motor de sincronización de punta a punta: las operaciones se crean con las acciones reales del operador
 * (operacionesTurno.ts) y del jefe de turno (accionesJefe.ts) sobre SQLite real (jest/expoSqliteNode.ts), y el
 * Backend se simula en apiRequest. Así se prueba lo que importa en terreno: qué llega al servidor, en qué orden y
 * con qué datos, y qué queda en el teléfono cuando el servidor falla o rechaza.
 */

// Solo se simula lo que no existe en Node: el servidor, la sesión, los UUID, la vibración y el archivo de la foto
let mockUuid = 0;
jest.mock('expo-crypto', () => ({ randomUUID: () => `uuid-${++mockUuid}` }));
jest.mock('../services/apiClient', () => ({ ...jest.requireActual('../services/apiClient'), apiRequest: jest.fn() }));
jest.mock('../services/authService', () => ({ sincronizarSesion: jest.fn() }));
jest.mock('../services/authStorage', () => ({
  leerSesion: jest.fn(),
  getStoredToken: jest.fn(async () => null),
  leerOperadorCache: jest.fn(async () => null),
}));
jest.mock('../services/retroalimentacion', () => ({ mostrarAviso: jest.fn() }));
jest.mock('../services/fotos', () => ({
  ...jest.requireActual('../services/fotos'),
  adjuntarFoto: jest.fn(async () => undefined),
  guardarFotoLocal: jest.fn(async (_uri: string, idCliente: string) => `file:///fotos/${idCliente}.jpg`),
  eliminarFotoLocal: jest.fn(),
}));

// ---------------------------------------------------------------------------------------------------------------
// Backend simulado
// ---------------------------------------------------------------------------------------------------------------

type Body = Record<string, any>;
type Ruta = (body: Body) => unknown;
interface Llamada {
  clave: string; // "POST /turnos/iniciar"
  body: Body | null;
}

const servidor = {
  enLinea: true,
  llamadas: [] as Llamada[],
  noSimuladas: [] as string[],
  rutas: {} as Record<string, Ruta>,
  // Estado mínimo del servidor para que la conciliación vea lo mismo que se le envió
  turno: null as { id: number; idCliente: string | null } | null,
  cerradoAuto: null as Body | null,
  cerradoPorJefe: null as Body | null,
};

const INICIO = new Date('2026-11-16T08:00:00Z').getTime();
const HORA = 60 * 60 * 1000;

const turnoApi = (cambios: Body = {}) => ({
  id: 100,
  idCliente: null,
  idOperador: 7,
  idMaquina: 5,
  estado: 'EN_CURSO',
  fechaInicio: new Date(INICIO).toISOString(),
  fechaFin: null,
  horometroInicial: 1000,
  horometroFinal: null,
  conflicto: false,
  conflictoDetalle: null,
  ...cambios,
});

const rechazar =
  (status: number, code?: string, mensaje = 'Rechazada por el servidor'): Ruta =>
  () => {
    throw new ApiError(mensaje, status, code);
  };

const rutasPorDefecto = (): Record<string, Ruta> => ({
  'POST /turnos/iniciar': (b) => {
    servidor.turno = { id: 100, idCliente: b.idCliente };
    return { turno: turnoApi({ idCliente: b.idCliente }), turnoCerradoAutomaticamente: null };
  },
  'POST /turnos/finalizar': (b) => {
    servidor.turno = null;
    return turnoApi({ estado: 'CERRADO', fechaFin: b.fechaFin, horometroFinal: b.horometroFinal });
  },
  'POST /turnos/estados': () => ({ id: 1 }),
  'POST /reportes': () => ({ id: 1 }),
  'POST /evidencias': () => ({ id: 1 }),
  'GET /turnos/actual': () => ({
    turno: servidor.turno ? { ...turnoApi(servidor.turno), maquina: null, area: null, zona: null, historialEstados: [] } : null,
    turnoCerradoAutomaticamente: servidor.cerradoAuto,
    turnoCerradoPorJefe: servidor.cerradoPorJefe,
  }),
  'GET /maquinas': () => [],
  'GET /areas': () => [],
  'GET /zonas': () => [],
  'GET /estados-operacionales': () => [],
  'PATCH /maquinas/5': (b) => ({ id: 5, version: (b.versionBase ?? 0) + 1 }),
  'PATCH /maquinas/6': (b) => ({ id: 6, version: (b.versionBase ?? 0) + 1 }),
  'POST /turnos/maquina/5/cierre': () => ({}),
});

const apiSimulada = async (ruta: string, init: RequestInit = {}) => {
  if (!servidor.enLinea) throw new ApiError('Problemas de conexión. Intenta más tarde.', 0);
  const clave = `${init.method ?? 'GET'} ${ruta}`;
  const body = typeof init.body === 'string' ? (JSON.parse(init.body) as Body) : null;
  servidor.llamadas.push({ clave, body });
  const responder = servidor.rutas[clave];
  if (!responder) {
    servidor.noSimuladas.push(clave);
    throw new Error(`Ruta no simulada: ${clave}`);
  }
  return responder(body ?? {});
};

// Lo que llegó al servidor (sin las consultas GET), en orden
const enviadas = () => servidor.llamadas.filter((l) => !l.clave.startsWith('GET ')).map((l) => l.clave);
const bodiesDe = (clave: string) => servidor.llamadas.filter((l) => l.clave === clave).map((l) => l.body);
const consulto = (clave: string) => servidor.llamadas.some((l) => l.clave === clave);

// ---------------------------------------------------------------------------------------------------------------
// Sesiones, datos y acciones
// ---------------------------------------------------------------------------------------------------------------

const SESION_OPERADOR = { version: 2, identificador: 'operador1', rol: 'OPERADOR', idOperador: 7, tokens: null } as unknown as SesionGuardada;
const SESION_JEFE = { version: 2, identificador: 'jefe1@cmp.cl', rol: 'JEFE_TURNO', idOperador: null, tokens: null } as unknown as SesionGuardada;
const OPERADOR = { idOperador: 7 };
const JEFE = { usuario: 'jefe1@cmp.cl' };

const MAQUINA: Maquina = {
  id: 5,
  codigoCorto: 'CF-05',
  nombreCompleto: 'Cargador CF-05',
  tipoMaquina: 'Cargador frontal',
  modelo: 'Modelo 1',
  idOperadorAsignado: 7,
  horometroUltimo: null,
};
const AREA = { id: 1, nombre: 'Planta', descripcion: null };
const OPERANDO: EstadoOperacional = { id: 3, nombre: 'Operando', categoria: 'PRODUCTIVO', esProductivo: true, descripcion: null };
const MAQUINA_FLOTA = (id = 5) => ({ id, codigo: `CF-0${id}`, operadorEnTurno: 'Operador 1', idTurnoActual: 100 }) as MaquinaFlota;
const MANTENCION: EditarMaquinaApi = { estado: 'EN_MANTENIMIENTO', motivo: 'Falla hidráulica', observacion: null, versionBase: 3 };

const avanzar = (ms: number) => jest.setSystemTime(Date.now() + ms);

// Cada acción dispara su propia sincronización en segundo plano: se espera a que termine antes de seguir
const hacer = async <T>(accion: () => Promise<T>): Promise<T> => {
  const resultado = await accion();
  await sincronizacionEnCurso();
  return resultado;
};

const sinSenal = async <T>(accion: () => Promise<T>): Promise<T> => {
  servidor.enLinea = false;
  try {
    return await hacer(accion);
  } finally {
    servidor.enLinea = true;
  }
};

// Vuelve la red: se registra solo lo que pasa desde ahora
const volverLaRed = async () => {
  servidor.llamadas = [];
  await sincronizar();
};

const iniciar = (cambios: Partial<IniciarTurnoDatos> = {}) =>
  iniciarTurno({ maquina: MAQUINA, horometroInicial: 1000, area: AREA, zona: null, instrucciones: '', foto: null, ...cambios });

const turnoEnCurso = async () => (await listarTurnosEnCurso(OPERADOR.idOperador))[0];

beforeAll(() => {
  jest.mocked(apiRequest).mockImplementation(apiSimulada as unknown as typeof apiRequest);
});

beforeEach(async () => {
  jest.useFakeTimers({ now: INICIO, doNotFake: ['nextTick', 'queueMicrotask', 'setImmediate'] });
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  jest.mocked(leerSesion).mockResolvedValue(SESION_OPERADOR);
  jest.mocked(mostrarAviso).mockClear();
  Object.assign(servidor, { enLinea: true, llamadas: [], noSimuladas: [], rutas: rutasPorDefecto(), turno: null, cerradoAuto: null, cerradoPorJefe: null });
  actualizarEstadoSincronizacion({ pendientes: 0, errores: 0, porConfirmar: 0, ultimaSincronizacion: null, ultimoError: null });

  const db = await getDb();
  await db.execAsync(`
    DELETE FROM operacion_pendiente; DELETE FROM turno; DELETE FROM turno_estado; DELETE FROM reporte;
    DELETE FROM evidencia; DELETE FROM ajuste; DELETE FROM catalogo; DELETE FROM registro_accion;
  `);
});

afterEach(async () => {
  await sincronizacionEnCurso();
  // Una ruta sin simular o un error inesperado del motor harían pasar un test por la razón equivocada
  expect(servidor.noSimuladas).toEqual([]);
  expect(console.warn).not.toHaveBeenCalled();
  // Solo el spy: en Jest 29 restoreAllMocks también borraría las implementaciones de los jest.mock de arriba
  jest.mocked(console.warn).mockRestore();
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------------------------------------------

describe('operador: lo hecho sin señal se envía al volver la red', () => {
  it('envía el turno completo en orden, con los UUID generados en el teléfono', async () => {
    await sinSenal(() => iniciar());
    const { idCliente } = await turnoEnCurso();
    await sinSenal(() => cambiarEstadoOperacional(idCliente, OPERANDO));
    avanzar(8 * HORA);
    await sinSenal(() => finalizarTurno(idCliente, { horometroFinal: 1008.5, novedades: '', foto: null }));
    expect(await contarOperaciones(OPERADOR)).toEqual({ pendientes: 3, errores: 0, porConfirmar: 0 });

    await volverLaRed();

    expect(enviadas()).toEqual(['POST /turnos/iniciar', 'POST /turnos/estados', 'POST /turnos/finalizar']);
    expect(bodiesDe('POST /turnos/iniciar')[0]).toEqual({
      idCliente,
      fechaInicio: new Date(INICIO).toISOString(),
      idMaquina: 5,
      horometroInicial: 1000,
      idArea: 1,
      idZona: null,
    });
    // Las operaciones posteriores referencian el turno por su UUID: el teléfono aún no conocía su id en el servidor
    expect(bodiesDe('POST /turnos/estados')[0]).toEqual({
      idCliente: expect.any(String),
      idClienteTurno: idCliente,
      idEstado: 3,
      inicio: new Date(INICIO).toISOString(),
    });
    expect(bodiesDe('POST /turnos/finalizar')[0]).toEqual({
      idClienteTurno: idCliente,
      horometroFinal: 1008.5,
      fechaFin: new Date(INICIO + 8 * HORA).toISOString(),
    });

    expect(await obtenerTurno(idCliente)).toMatchObject({ idServidor: 100, sincronizado: true, estado: 'CERRADO', horometroFinal: 1008.5 });
    expect(await contarOperaciones(OPERADOR)).toEqual({ pendientes: 0, errores: 0, porConfirmar: 0 });
    expect(obtenerEstadoSincronizacion()).toMatchObject({
      sincronizando: false,
      pendientes: 0,
      errores: 0,
      ultimoError: null,
      ultimaSincronizacion: new Date(INICIO + 8 * HORA).toISOString(),
    });
  });

  it('el servidor manda sobre el resultado del cierre (p. ej. lo dio por cerrado automáticamente)', async () => {
    await sinSenal(() => iniciar());
    const { idCliente } = await turnoEnCurso();
    avanzar(2 * HORA);
    await sinSenal(() => finalizarTurno(idCliente, { horometroFinal: 1002, novedades: '', foto: null }));
    const finServidor = new Date(INICIO + HORA).toISOString();
    servidor.rutas['POST /turnos/finalizar'] = () => turnoApi({ estado: 'CERRADO_AUTO', fechaFin: finServidor, horometroFinal: 1002 });

    await volverLaRed();

    expect(await obtenerTurno(idCliente)).toMatchObject({ estado: 'CERRADO_AUTO', fechaFin: finServidor });
  });

  it('sin sesión no envía nada y la cola espera', async () => {
    await sinSenal(() => iniciar());
    jest.mocked(leerSesion).mockResolvedValue(null);

    await volverLaRed();

    expect(servidor.llamadas).toEqual([]);
    expect(await contarOperaciones(OPERADOR)).toEqual({ pendientes: 1, errores: 0, porConfirmar: 0 });
  });
});

describe('operador: errores del servidor', () => {
  const turnoConEstadoSinEnviar = async () => {
    await sinSenal(() => iniciar());
    const { idCliente } = await turnoEnCurso();
    await sinSenal(() => cambiarEstadoOperacional(idCliente, OPERANDO));
    return idCliente;
  };

  it('5xx: reintenta más tarde sin saltarse el orden, con los mismos datos y el mismo idCliente', async () => {
    const idCliente = await turnoConEstadoSinEnviar();
    await sinSenal(() => finalizarTurno(idCliente, { horometroFinal: 1001, novedades: '', foto: null }));
    servidor.rutas['POST /turnos/estados'] = rechazar(503, undefined, 'El servidor no está disponible');

    await volverLaRed();

    // El cierre espera detrás del estado que falló
    expect(enviadas()).toEqual(['POST /turnos/iniciar', 'POST /turnos/estados']);
    expect(consulto('GET /turnos/actual')).toBe(false);
    const [estado] = await listarTodasLasOperaciones(OPERADOR);
    expect(estado).toMatchObject({ tipo: 'REGISTRAR_ESTADO', estado: 'PENDIENTE', intentos: 1, ultimoError: 'El servidor no está disponible' });
    expect(obtenerEstadoSincronizacion()).toMatchObject({ pendientes: 2, ultimoError: 'El servidor no respondió; se reintentará.' });
    const primerIntento = bodiesDe('POST /turnos/estados')[0];

    servidor.rutas['POST /turnos/estados'] = () => ({ id: 1 });
    avanzar(15_000);
    await volverLaRed();

    expect(enviadas()).toEqual(['POST /turnos/estados', 'POST /turnos/finalizar']);
    expect(bodiesDe('POST /turnos/estados')[0]).toEqual(primerIntento);
    expect(await contarOperaciones(OPERADOR)).toEqual({ pendientes: 0, errores: 0, porConfirmar: 0 });
    expect(obtenerEstadoSincronizacion().ultimoError).toBeNull();
  });

  it('4xx: deja la operación con error para revisión y sigue con las siguientes', async () => {
    const idCliente = await turnoConEstadoSinEnviar();
    await sinSenal(() => finalizarTurno(idCliente, { horometroFinal: 1001, novedades: '', foto: null }));
    servidor.rutas['POST /turnos/estados'] = rechazar(400, 'ESTADO_INVALIDO', 'El estado operacional no existe.');

    await volverLaRed();

    expect(enviadas()).toEqual(['POST /turnos/iniciar', 'POST /turnos/estados', 'POST /turnos/finalizar']);
    expect(await listarTodasLasOperaciones(OPERADOR)).toEqual([
      expect.objectContaining({
        tipo: 'REGISTRAR_ESTADO',
        estado: 'ERROR',
        codigoError: 'ESTADO_INVALIDO',
        ultimoError: 'El estado operacional no existe.',
      }),
    ]);
    expect(obtenerEstadoSincronizacion()).toMatchObject({ pendientes: 0, errores: 1 });
  });

  it.each([408, 429])('%p es transitorio: se reintenta, no se marca con error', async (status) => {
    await turnoConEstadoSinEnviar();
    servidor.rutas['POST /turnos/estados'] = rechazar(status);

    await volverLaRed();

    expect(await contarOperaciones(OPERADOR)).toEqual({ pendientes: 1, errores: 0, porConfirmar: 0 });
    expect((await listarTodasLasOperaciones(OPERADOR))[0].intentos).toBe(1);
  });

  it('sin conexión a mitad de la cola: se detiene sin gastar un intento ni conciliar', async () => {
    await turnoConEstadoSinEnviar();
    servidor.rutas['POST /turnos/estados'] = rechazar(0);

    await volverLaRed();

    expect(consulto('GET /turnos/actual')).toBe(false);
    expect(await listarTodasLasOperaciones(OPERADOR)).toEqual([expect.objectContaining({ tipo: 'REGISTRAR_ESTADO', estado: 'PENDIENTE', intentos: 0 })]);
    expect(obtenerEstadoSincronizacion().ultimoError).toBeNull();
  });

  it('sesión vencida (401): se detiene sin marcar errores, hasta renovar la sesión', async () => {
    await turnoConEstadoSinEnviar();
    servidor.rutas['POST /turnos/estados'] = rechazar(401);

    await volverLaRed();

    expect(await listarTodasLasOperaciones(OPERADOR)).toEqual([expect.objectContaining({ estado: 'PENDIENTE', intentos: 0 })]);
    expect(obtenerEstadoSincronizacion().ultimoError).toBeNull();
  });
});

describe('operador: fotos', () => {
  const FOTO = { uri: 'file:///camara/foto.jpg', mimeType: 'image/jpeg' };

  // Inicio con foto (reporte + evidencia) y luego un cambio de estado
  const turnoConFoto = async () => {
    await sinSenal(() => iniciar({ instrucciones: 'Revisar neumáticos', foto: FOTO }));
    const { idCliente } = await turnoEnCurso();
    await sinSenal(() => cambiarEstadoOperacional(idCliente, OPERANDO));
  };
  const operacionFoto = async () => (await listarTodasLasOperaciones(OPERADOR)).find((o) => o.tipo === 'SUBIR_EVIDENCIA');
  const estadoEvidencia = async () => (await listarEvidencias(OPERADOR.idOperador))[0].estadoSync;

  it('sube la foto después de su reporte', async () => {
    await turnoConFoto();

    await volverLaRed();

    expect(enviadas()).toEqual(['POST /turnos/iniciar', 'POST /reportes', 'POST /evidencias', 'POST /turnos/estados']);
    expect(await estadoEvidencia()).toBe('SINCRONIZADO');
  });

  it('una foto que no sube no traba el resto del turno: se reintenta aparte', async () => {
    await turnoConFoto();
    servidor.rutas['POST /evidencias'] = rechazar(500);

    await volverLaRed();

    expect(enviadas()).toEqual(['POST /turnos/iniciar', 'POST /reportes', 'POST /evidencias', 'POST /turnos/estados']);
    expect(await operacionFoto()).toMatchObject({ estado: 'PENDIENTE', intentos: 1 });
    expect(await estadoEvidencia()).toBe('PENDIENTE');
  });

  it('una foto que ya no está en el teléfono queda con error sin reintentarse', async () => {
    await turnoConFoto();
    jest.mocked(adjuntarFoto).mockRejectedValueOnce(new FotoNoEncontradaError('file:///fotos/borrada.jpg'));

    await volverLaRed();

    expect(consulto('POST /evidencias')).toBe(false);
    expect(enviadas()).toContain('POST /turnos/estados');
    expect(await operacionFoto()).toMatchObject({ estado: 'ERROR', ultimoError: 'La foto ya no está guardada en el teléfono.' });
    expect(await estadoEvidencia()).toBe('ERROR_SINCRONIZACION');
  });

  it('tras 8 intentos fallidos la foto queda con error', async () => {
    await turnoConFoto();
    await (await getDb()).runAsync("UPDATE operacion_pendiente SET intentos = 7 WHERE tipo = 'SUBIR_EVIDENCIA'");
    servidor.rutas['POST /evidencias'] = rechazar(500);

    await volverLaRed();

    expect(await operacionFoto()).toMatchObject({ estado: 'ERROR', intentos: 8 });
    expect(await estadoEvidencia()).toBe('ERROR_SINCRONIZACION');
  });
});

describe('operador: conciliación con el servidor (con la cola vacía)', () => {
  it('copia el cierre que hizo el jefe de turno y deja el aviso para el operador', async () => {
    await hacer(() => iniciar());
    const { idCliente } = await turnoEnCurso();
    const fin = new Date(INICIO + 3 * HORA).toISOString();
    servidor.turno = null;
    servidor.cerradoPorJefe = turnoApi({ idCliente, estado: 'CERRADO', fechaFin: fin, horometroFinal: 1520, cerradoPorJefe: true, motivoCierre: 'Mantención' });

    await volverLaRed();

    expect(await obtenerTurno(idCliente)).toMatchObject({ estado: 'CERRADO', fechaFin: fin, horometroFinal: 1520 });
    expect(await leerAjuste(AVISO_CIERRE_JEFE(OPERADOR.idOperador))).toMatchObject({ idCliente, horometroFinal: 1520, motivo: 'Mantención' });
  });

  it('copia el cierre automático sin inventar el horómetro final', async () => {
    await hacer(() => iniciar());
    const { idCliente } = await turnoEnCurso();
    const fin = new Date(INICIO + 13 * HORA).toISOString();
    servidor.turno = null;
    servidor.cerradoAuto = turnoApi({ idCliente, estado: 'CERRADO_AUTO', fechaFin: fin });

    await volverLaRed();

    expect(await obtenerTurno(idCliente)).toMatchObject({ estado: 'CERRADO_AUTO', fechaFin: fin, horometroFinal: null });
  });

  const estadosDelTurno = (idClienteTurno: string) =>
    getDb().then((db) =>
      db.getAllAsync<{ inicio: string; fin: string | null }>('SELECT inicio, fin FROM turno_estado WHERE id_cliente_turno = ? ORDER BY inicio', [
        idClienteTurno,
      ]),
    );

  it('cierra el estado vigente a la hora en que el servidor cerró el turno, no cuando el teléfono sincroniza', async () => {
    await hacer(() => iniciar());
    const { idCliente } = await turnoEnCurso();
    await hacer(() => cambiarEstadoOperacional(idCliente, OPERANDO));
    const fin = new Date(INICIO + 13 * HORA).toISOString();
    servidor.turno = null;
    servidor.cerradoAuto = turnoApi({ idCliente, estado: 'CERRADO_AUTO', fechaFin: fin });

    // El teléfono pasó la noche sin señal: sincroniza 17 h después del cierre
    avanzar(30 * HORA);
    await volverLaRed();

    expect(await obtenerTurno(idCliente)).toMatchObject({ estado: 'CERRADO_AUTO', fechaFin: fin });
    expect(await estadosDelTurno(idCliente)).toEqual([{ inicio: new Date(INICIO).toISOString(), fin }]);
  });

  it('un estado registrado sin señal después del cierre del servidor queda con duración cero, no negativa', async () => {
    await hacer(() => iniciar());
    const { idCliente } = await turnoEnCurso();
    avanzar(HORA / 2);
    await hacer(() => cambiarEstadoOperacional(idCliente, OPERANDO));
    // El jefe de turno cierra el turno a las 2 h; el operador, sin señal, sigue registrando a las 3 h
    const fin = new Date(INICIO + 2 * HORA).toISOString();
    servidor.turno = null;
    servidor.cerradoPorJefe = turnoApi({ idCliente, estado: 'CERRADO', fechaFin: fin, horometroFinal: 1002, cerradoPorJefe: true });
    servidor.rutas['POST /turnos/estados'] = rechazar(409, 'TURNO_CERRADO', 'El turno ya está cerrado.');
    avanzar(2.5 * HORA);
    await sinSenal(() => cambiarEstadoOperacional(idCliente, OPERANDO));

    await volverLaRed();

    const tarde = new Date(INICIO + 3 * HORA).toISOString();
    expect(await estadosDelTurno(idCliente)).toEqual([
      { inicio: new Date(INICIO + HORA / 2).toISOString(), fin },
      { inicio: tarde, fin: tarde },
    ]);
  });

  it('trae el turno abierto desde otro teléfono, con su historial de estados', async () => {
    const inicio = new Date(INICIO - HORA).toISOString();
    servidor.rutas['GET /turnos/actual'] = () => ({
      turno: {
        ...turnoApi({ id: 200, fechaInicio: inicio }),
        maquina: { idMaquina: 5, nombre: 'CF-05', marca: null, modelo: null, tipoMaquina: null, estado: 'ACTIVA' },
        area: { idArea: 1, nombre: 'Planta', descripcion: null },
        zona: null,
        historialEstados: [{ idCliente: null, inicio, fin: null, estado: { idEstado: 3, nombre: 'Operando', categoria: 'PRODUCTIVO' } }],
      },
      turnoCerradoAutomaticamente: null,
    });

    await volverLaRed();

    expect(await turnoEnCurso()).toMatchObject({ idCliente: 'srv-200', idServidor: 200, sincronizado: true, estado: 'EN_CURSO', maquina: { id: 5 } });
    const estados = await (await getDb()).getAllAsync<{ id_cliente_turno: string }>('SELECT id_cliente_turno FROM turno_estado');
    expect(estados).toEqual([{ id_cliente_turno: 'srv-200' }]);
  });

  it('no cierra un turno local que el servidor nunca aceptó', async () => {
    await sinSenal(() => iniciar());
    servidor.rutas['POST /turnos/iniciar'] = rechazar(409, 'MAQUINA_EN_USO', 'La máquina ya tiene un turno en curso.');

    await volverLaRed();

    // Con la cola sin pendientes sí concilia, pero el turno sigue abierto en el teléfono para que el operador lo vea
    expect(consulto('GET /turnos/actual')).toBe(true);
    expect(await turnoEnCurso()).toMatchObject({ estado: 'EN_CURSO', sincronizado: false });
    expect(obtenerEstadoSincronizacion()).toMatchObject({ errores: 1 });
  });

  it('descarga los catálogos y no los repite antes de 30 minutos', async () => {
    servidor.rutas['GET /maquinas'] = () => [{ idMaquina: 5, nombre: 'CF-05', marca: null, modelo: null, tipoMaquina: null, estado: 'ACTIVA' }];
    const catalogos = () => ['GET /maquinas', 'GET /areas', 'GET /zonas', 'GET /estados-operacionales'].filter(consulto);

    await volverLaRed();
    expect(catalogos()).toHaveLength(4);
    expect(await leerCatalogo('maquina')).toEqual([expect.objectContaining({ id: 5 })]);

    avanzar(29 * 60_000);
    await volverLaRed();
    expect(catalogos()).toEqual([]);

    avanzar(2 * 60_000);
    await volverLaRed();
    expect(catalogos()).toHaveLength(4);
  });
});

describe('jefe de turno: acciones hechas sin señal', () => {
  beforeEach(() => {
    jest.mocked(leerSesion).mockResolvedValue(SESION_JEFE);
  });

  const editarSinSenal = async (datos: EditarMaquinaApi = MANTENCION, idMaquina = 5) => {
    const accion = nuevaAccion();
    const resultado = await sinSenal(() => editarMaquinaJefe(MAQUINA_FLOTA(idMaquina), datos, { estado: datos.estado }, accion));
    expect(resultado).toEqual({ enviada: false });
    return accion;
  };

  it('envía la acción con la fecha en que se hizo, no la del envío, y no concilia turnos', async () => {
    const accion = await editarSinSenal();
    avanzar(2 * HORA);

    await volverLaRed();

    expect(servidor.llamadas.map((l) => l.clave)).toEqual(['PATCH /maquinas/5']);
    expect(bodiesDe('PATCH /maquinas/5')[0]).toEqual({ ...MANTENCION, idCliente: accion.idCliente, fechaAccion: accion.fechaAccion });
    expect(await contarOperaciones(JEFE)).toEqual({ pendientes: 0, errores: 0, porConfirmar: 0 });
  });

  it('encadena la versión: la segunda edición de la máquina parte de la que dejó la primera', async () => {
    await editarSinSenal();
    await editarSinSenal({ motivo: 'Cambio de operador', observacion: null, versionBase: 3, idOperador: 9 } as EditarMaquinaApi);

    await volverLaRed();

    expect(bodiesDe('PATCH /maquinas/5').map((b) => b?.versionBase)).toEqual([3, 4]);
  });

  it('si otro jefe cambió la máquina entremedio, la segunda conserva la versión que vio (el Backend decide)', async () => {
    await editarSinSenal();
    await editarSinSenal({ motivo: 'Cambio de operador', observacion: null, versionBase: 3 });
    servidor.rutas['PATCH /maquinas/5'] = () => ({ id: 5, version: 6 });

    await volverLaRed();

    expect(bodiesDe('PATCH /maquinas/5').map((b) => b?.versionBase)).toEqual([3, 3]);
  });

  it('una edición rechazada por conflicto frena las siguientes de esa máquina, no las de otras', async () => {
    await editarSinSenal();
    await editarSinSenal({ motivo: 'Otro cambio', observacion: null, versionBase: 3 });
    await editarSinSenal(MANTENCION, 6);
    servidor.rutas['PATCH /maquinas/5'] = rechazar(409, 'MAQUINA_MODIFICADA', 'Otro jefe de turno modificó la máquina.');

    await volverLaRed();

    expect(enviadas()).toEqual(['PATCH /maquinas/5', 'PATCH /maquinas/6']);
    expect((await listarTodasLasOperaciones(JEFE)).map((o) => [o.estado, o.codigoError])).toEqual([
      ['ERROR', 'MAQUINA_MODIFICADA'],
      ['PENDIENTE', null],
    ]);
  });

  it('un cierre que otro ya hizo no es error: avisa, lo registra y sigue con el cambio de estado de la máquina', async () => {
    const mensaje = 'El turno ya fue cerrado por Operador 1 a las 10:00.';
    const cierre = nuevaAccion();
    expect(await sinSenal(() => cerrarTurnoJefe(MAQUINA_FLOTA(), 1520, 'Mantención', cierre))).toEqual({ estado: 'en-cola' });
    await editarSinSenal();
    servidor.rutas['POST /turnos/maquina/5/cierre'] = rechazar(409, 'TURNO_YA_CERRADO', mensaje);

    await volverLaRed();

    expect(enviadas()).toEqual(['POST /turnos/maquina/5/cierre', 'PATCH /maquinas/5']);
    expect(bodiesDe('POST /turnos/maquina/5/cierre')[0]).toEqual({
      horometroFinal: 1520,
      motivo: 'Mantención',
      idTurno: 100,
      idCliente: cierre.idClienteCierre,
      fechaAccion: cierre.fechaAccion,
    });
    expect(mostrarAviso).toHaveBeenCalledWith(mensaje, expect.objectContaining({ tipo: 'info' }));
    expect(await listarRegistroAcciones(JEFE.usuario)).toEqual([expect.objectContaining({ evento: 'TURNO_YA_CERRADO', detalle: mensaje })]);
    expect(await contarOperaciones(JEFE)).toEqual({ pendientes: 0, errores: 0, porConfirmar: 0 });
  });

  it('con más de 24 h espera la confirmación del jefe de turno', async () => {
    await editarSinSenal();
    avanzar(30 * HORA);

    await volverLaRed();

    expect(servidor.llamadas).toEqual([]);
    expect(await listarTodasLasOperaciones(JEFE)).toEqual([expect.objectContaining({ estado: 'REQUIERE_CONFIRMACION' })]);
    expect(obtenerEstadoSincronizacion()).toMatchObject({ pendientes: 0, porConfirmar: 1 });
  });

  it('con más de 72 h se descarta sin enviarla, se avisa y queda en el registro', async () => {
    await editarSinSenal();
    avanzar(73 * HORA);

    await volverLaRed();

    expect(servidor.llamadas).toEqual([]);
    expect(await listarTodasLasOperaciones(JEFE)).toEqual([]);
    expect(mostrarAviso).toHaveBeenCalledWith(expect.stringContaining('72 h'), expect.objectContaining({ tipo: 'error' }));
    expect(await listarRegistroAcciones(JEFE.usuario)).toEqual([
      expect.objectContaining({ evento: 'VENCIDA', descripcion: 'Cambio de estado de CF-05 a En mantenimiento' }),
    ]);
  });

  it('también la descarta si el Backend, con su reloj, dice que venció (ACCION_VENCIDA)', async () => {
    const mensaje = 'La acción se hizo hace más de 72 h y no se aplicó.';
    await editarSinSenal();
    servidor.rutas['PATCH /maquinas/5'] = rechazar(422, 'ACCION_VENCIDA', mensaje);

    await volverLaRed();

    expect(await listarTodasLasOperaciones(JEFE)).toEqual([]);
    expect(await listarRegistroAcciones(JEFE.usuario)).toEqual([expect.objectContaining({ evento: 'VENCIDA', detalle: mensaje })]);
  });
});

describe('ejecuciones concurrentes', () => {
  it('una acción hecha mientras se concilia se envía en la misma sincronización', async () => {
    await hacer(() => iniciar());
    const { idCliente } = await turnoEnCurso();

    // La conciliación queda esperando la respuesta del servidor
    const conciliar = servidor.rutas['GET /turnos/actual'];
    let avisarConsulta!: () => void;
    let liberar!: () => void;
    const consultando = new Promise<void>((resolve) => (avisarConsulta = resolve));
    const respuesta = new Promise<void>((resolve) => (liberar = resolve));
    servidor.rutas['GET /turnos/actual'] = async (body) => {
      servidor.rutas['GET /turnos/actual'] = conciliar;
      avisarConsulta();
      await respuesta;
      return conciliar(body);
    };

    servidor.llamadas = [];
    const ronda = sincronizar();
    await consultando;
    await cambiarEstadoOperacional(idCliente, OPERANDO);
    // Pedir otra sincronización mientras corre una no inicia otra en paralelo: se agenda para después
    expect(sincronizar()).toBe(ronda);
    liberar();
    await ronda;

    expect(enviadas()).toEqual(['POST /turnos/estados']);
    expect(await contarOperaciones(OPERADOR)).toEqual({ pendientes: 0, errores: 0, porConfirmar: 0 });
  });
});
