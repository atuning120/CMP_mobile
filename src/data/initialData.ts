import { PerfilPrueba } from '../types/mining';

// Credenciales de prueba para el acceso rápido del login
export const INITIAL_OPERADORES: PerfilPrueba[] = [
  {
    id_operador: 1,
    nombre: 'Operador',
    apellido: 'Ejemplo',
    rut: '15.123.456-7',
    telefono: '+56 9 1234 5678',
    estado: 'En Faena',
    email: 'cristian.nunez@cmp.cl',
    empresa: 'Servicio Movimiento de Material MLC',
    rol: 'Operador de Maquinaria',
    password: '12345',
  },
  {
    id_operador: 2,
    nombre: 'Jefe',
    apellido: 'Turno',
    rut: '16.987.654-3',
    telefono: '+56 9 8765 4321',
    estado: 'En Faena',
    email: 'ana.rojas@cmp.cl',
    empresa: 'Servicio Movimiento de Material MLC',
    rol: 'Jefe de Turno',
    password: 'miPassword123',
  }
];
