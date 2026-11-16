import { getDb } from '../db/database';
import {
  actualizarPayload,
  adelantarReintentos,
  completarOperacion,
  contarOperaciones,
  descartarOperacionesConClave,
  descartarOperacionesDeEntidad,
  duenoDeSesion,
  encolar,
  encolarAccionJefe,
  listarSiguientesConClave,
  listarTodasLasOperaciones,
  marcarOperacionConError,
  marcarRequiereConfirmacion,
  obtenerOperacion,
  reactivarOperacion,
  reintentarOperacionesConError,
  reprogramarOperacion,
  siguienteOperacion,
  type TipoOperacion,
} from './colaSync';

/*
 * La cola corre sobre SQLite real (node:sqlite vía jest/expoSqliteNode.ts) con las migraciones de src/db/database.ts:
 * el orden, el bloqueo por clave y el backoff están en el SQL, así que un mock no los probaría.
 */

const OPERADOR = { idOperador: 7 };
const OTRO_OPERADOR = { idOperador: 8 };
const JEFE = { usuario: 'jefe1@cmp.cl' };
const INICIO = new Date('2026-11-16T12:00:00Z').getTime();

const avanzar = (ms: number) => jest.setSystemTime(Date.now() + ms);

const encolarOperador = async (idEntidad: string, idOperador = OPERADOR.idOperador, tipo: TipoOperacion = 'REGISTRAR_ESTADO') =>
  encolar(await getDb(), { tipo, idEntidad, idOperador, payload: { idEntidad } });

const encolarJefe = async (idEntidad: string, claveBloqueo: string, tipo: TipoOperacion = 'EDITAR_MAQUINA', usuario = JEFE.usuario) =>
  encolarAccionJefe(await getDb(), {
    tipo,
    idEntidad,
    usuario,
    claveBloqueo,
    fechaAccion: new Date().toISOString(),
    payload: { idEntidad },
  });

const siguienteEntidad = async (dueno: Parameters<typeof siguienteOperacion>[0]) => (await siguienteOperacion(dueno))?.idEntidad ?? null;

beforeEach(async () => {
  // Solo se simula el reloj: las promesas de la base deben resolverse normalmente
  jest.useFakeTimers({ now: INICIO, doNotFake: ['nextTick', 'queueMicrotask', 'setImmediate'] });
  const db = await getDb();
  await db.execAsync("DELETE FROM operacion_pendiente; DELETE FROM sqlite_sequence WHERE name = 'operacion_pendiente';");
});

afterEach(() => {
  jest.useRealTimers();
});

describe('duenoDeSesion', () => {
  const sesion = (cambios: Record<string, unknown>) => ({ identificador: 'jefe1@cmp.cl', idOperador: null, ...cambios }) as never;

  it('el jefe de turno es dueño de su cola por usuario y el operador por su id', () => {
    expect(duenoDeSesion(sesion({ rol: 'JEFE_TURNO', idOperador: 3 }))).toEqual({ usuario: 'jefe1@cmp.cl' });
    expect(duenoDeSesion(sesion({ rol: 'OPERADOR', idOperador: 7 }))).toEqual({ idOperador: 7 });
  });

  it('sin sesión o sin operador no hay cola que enviar', () => {
    expect(duenoDeSesion(null)).toBeNull();
    expect(duenoDeSesion(sesion({ rol: 'OPERADOR', idOperador: null }))).toBeNull();
  });
});

describe('orden y dueño', () => {
  it('entrega las operaciones en orden de registro, con su payload', async () => {
    await encolarOperador('a');
    await encolarOperador('b');

    const primera = await siguienteOperacion(OPERADOR);
    expect(primera).toMatchObject({ idEntidad: 'a', payload: { idEntidad: 'a' }, estado: 'PENDIENTE', intentos: 0 });

    await completarOperacion(primera!.id);
    expect(await siguienteEntidad(OPERADOR)).toBe('b');
  });

  it('cada sesión solo ve su propia cola', async () => {
    await encolarOperador('del-otro', OTRO_OPERADOR.idOperador);
    await encolarJefe('del-jefe', 'maquina:1');
    await encolarOperador('mia');

    expect(await siguienteEntidad(OPERADOR)).toBe('mia');
    expect(await siguienteEntidad(OTRO_OPERADOR)).toBe('del-otro');
    expect(await siguienteEntidad(JEFE)).toBe('del-jefe');
    expect(await siguienteEntidad({ usuario: 'otro-jefe@cmp.cl' })).toBeNull();
  });
});

describe('errores y bloqueo por clave', () => {
  it('una operación del operador rechazada no detiene las siguientes (no tienen clave)', async () => {
    await encolarOperador('a');
    await encolarOperador('b');

    await marcarOperacionConError((await siguienteOperacion(OPERADOR))!, 'Rechazada', 'DATOS_INVALIDOS');

    expect(await siguienteEntidad(OPERADOR)).toBe('b');
    expect(await contarOperaciones(OPERADOR)).toEqual({ pendientes: 1, errores: 1, porConfirmar: 0 });
  });

  it('una acción del jefe de turno con error detiene solo las siguientes de su misma máquina', async () => {
    await encolarJefe('m1-a', 'maquina:1');
    await encolarJefe('m1-b', 'maquina:1');
    await encolarJefe('m2-a', 'maquina:2');

    await marcarOperacionConError((await siguienteOperacion(JEFE))!, 'Otro jefe cambió la máquina', 'MAQUINA_MODIFICADA');

    // m1-b espera a que se resuelva m1-a; la máquina 2 sigue
    expect(await siguienteEntidad(JEFE)).toBe('m2-a');
    await completarOperacion((await siguienteOperacion(JEFE))!.id);
    expect(await siguienteOperacion(JEFE)).toBeNull();
  });

  it('una acción que requiere confirmación también detiene las siguientes de su clave', async () => {
    await encolarJefe('m1-a', 'maquina:1');
    await encolarJefe('m1-b', 'maquina:1');

    await marcarRequiereConfirmacion((await siguienteOperacion(JEFE))!.id);
    expect(await siguienteOperacion(JEFE)).toBeNull();
    expect(await contarOperaciones(JEFE)).toEqual({ pendientes: 1, errores: 0, porConfirmar: 1 });
  });

  it('la clave solo bloquea dentro de la cola del mismo jefe de turno', async () => {
    await encolarJefe('de-jefe-1', 'maquina:1');
    await encolarJefe('de-jefe-2', 'maquina:1', 'EDITAR_MAQUINA', 'jefe2@cmp.cl');

    await marcarOperacionConError((await siguienteOperacion(JEFE))!, 'Rechazada');
    expect(await siguienteEntidad({ usuario: 'jefe2@cmp.cl' })).toBe('de-jefe-2');
  });

  it('al confirmar, la acción vuelve a la cola con su payload ajustado y sin el error anterior', async () => {
    await encolarJefe('m1-a', 'maquina:1');
    const op = (await siguienteOperacion(JEFE))!;
    await marcarOperacionConError(op, 'Rechazada', 'MAQUINA_MODIFICADA');

    await reactivarOperacion(op.id, { idEntidad: 'm1-a', confirmada: true });

    expect(await siguienteOperacion(JEFE)).toMatchObject({
      estado: 'PENDIENTE',
      payload: { idEntidad: 'm1-a', confirmada: true },
      ultimoError: null,
      codigoError: null,
    });
  });

  it('reintentar las con error las devuelve a la cola sin tocar las de otro dueño', async () => {
    await encolarOperador('mia');
    await encolarOperador('del-otro', OTRO_OPERADOR.idOperador);
    await marcarOperacionConError((await siguienteOperacion(OPERADOR))!, 'Rechazada');
    await marcarOperacionConError((await siguienteOperacion(OTRO_OPERADOR))!, 'Rechazada');

    await reintentarOperacionesConError(OPERADOR);

    expect(await siguienteEntidad(OPERADOR)).toBe('mia');
    expect(await contarOperaciones(OTRO_OPERADOR)).toEqual({ pendientes: 0, errores: 1, porConfirmar: 0 });
  });
});

describe('backoff', () => {
  it('reintenta con espera exponencial desde 15 s', async () => {
    await encolarOperador('a');

    let op = (await siguienteOperacion(OPERADOR))!;
    await reprogramarOperacion(op, 'Sin conexión');
    avanzar(14_999);
    expect(await siguienteOperacion(OPERADOR)).toBeNull();
    avanzar(1);
    op = (await siguienteOperacion(OPERADOR))!;
    expect(op).toMatchObject({ intentos: 1, ultimoError: 'Sin conexión' });

    // Segundo fallo: 30 s
    await reprogramarOperacion(op, 'Sin conexión');
    avanzar(29_999);
    expect(await siguienteOperacion(OPERADOR)).toBeNull();
    avanzar(1);
    expect((await siguienteOperacion(OPERADOR))?.intentos).toBe(2);
  });

  it('la espera nunca pasa de 15 minutos', async () => {
    await encolarOperador('a');
    const op = (await siguienteOperacion(OPERADOR))!;

    await reprogramarOperacion({ ...op, intentos: 30 }, 'Sin conexión');
    avanzar(15 * 60_000 - 1);
    expect(await siguienteOperacion(OPERADOR)).toBeNull();
    avanzar(1);
    expect(await siguienteEntidad(OPERADOR)).toBe('a');
  });

  it('al recuperar la red se ignora la espera', async () => {
    await encolarOperador('a');
    await reprogramarOperacion((await siguienteOperacion(OPERADOR))!, 'Sin conexión');
    expect(await siguienteOperacion(OPERADOR)).toBeNull();

    await adelantarReintentos(OPERADOR);
    expect(await siguienteEntidad(OPERADOR)).toBe('a');
  });

  it('una operación en espera no deja pasar a las siguientes de su clave', async () => {
    await encolarJefe('m1-a', 'maquina:1');
    await encolarJefe('m1-b', 'maquina:1');

    await reprogramarOperacion((await siguienteOperacion(JEFE))!, 'Sin conexión');
    expect(await siguienteOperacion(JEFE)).toBeNull();
  });
});

describe('atomicidad del outbox', () => {
  it('si la transacción de la acción falla, su operación no queda encolada', async () => {
    const db = await getDb();
    await expect(
      db.withExclusiveTransactionAsync(async (txn) => {
        await encolar(txn, { tipo: 'INICIAR_TURNO', idEntidad: 'turno-1', idOperador: OPERADOR.idOperador, payload: {} });
        throw new Error('falló el INSERT del turno');
      }),
    ).rejects.toThrow('falló el INSERT del turno');

    expect(await listarTodasLasOperaciones(OPERADOR)).toEqual([]);
  });
});

describe('encadenamiento y descarte', () => {
  it('lista las que esperan detrás con la misma clave y permite ajustar su payload', async () => {
    await encolarJefe('m1-a', 'maquina:1');
    await encolarJefe('m2-a', 'maquina:2');
    await encolarJefe('m1-b', 'maquina:1');

    const primera = (await siguienteOperacion(JEFE))!;
    const siguientes = await listarSiguientesConClave(primera);
    expect(siguientes.map((o) => o.idEntidad)).toEqual(['m1-b']);

    await actualizarPayload(siguientes[0].id, { versionBase: 4 });
    expect((await obtenerOperacion(siguientes[0].id))?.payload).toEqual({ versionBase: 4 });
  });

  it('las operaciones del operador no encadenan (no tienen clave)', async () => {
    await encolarOperador('a');
    await encolarOperador('b');
    expect(await listarSiguientesConClave((await siguienteOperacion(OPERADOR))!)).toEqual([]);
  });

  it('descartar por clave borra solo las de esa máquina y ese jefe de turno', async () => {
    await encolarJefe('m1-a', 'maquina:1');
    await encolarJefe('m2-a', 'maquina:2');
    await encolarJefe('otro-m1', 'maquina:1', 'EDITAR_MAQUINA', 'jefe2@cmp.cl');

    await descartarOperacionesConClave(JEFE, 'maquina:1');

    expect((await listarTodasLasOperaciones(JEFE)).map((o) => o.idEntidad)).toEqual(['m2-a']);
    expect(await siguienteEntidad({ usuario: 'jefe2@cmp.cl' })).toBe('otro-m1');
  });

  it('descartar por entidad quita la operación de una foto aún no enviada', async () => {
    await encolarOperador('foto-1', OPERADOR.idOperador, 'SUBIR_EVIDENCIA');
    await encolarOperador('estado-1');

    expect(await descartarOperacionesDeEntidad(await getDb(), 'foto-1')).toBe(1);
    expect((await listarTodasLasOperaciones(OPERADOR)).map((o) => o.idEntidad)).toEqual(['estado-1']);
  });
});
