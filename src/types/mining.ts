export interface Operador {
  id_operador: number;
  nombre: string;
  apellido: string;
  rut: string;
  telefono: string;
  estado: string;
  email: string;
  empresa: string;
  rol: string;
}

// Perfil del acceso rápido del login. Solo para pruebas: incluye la contraseña en texto plano.
export interface PerfilPrueba extends Operador {
  password: string;
}

export type VisualContrastMode = 'day' | 'night';
export type NetworkState = 'online' | 'offline';
export type DeviceViewMode = 'phone' | 'tablet';
export type OperationalStatus = 'Operando' | 'Detenido' | 'Mantenimiento';
