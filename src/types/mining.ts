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

export type VisualContrastMode = 'day' | 'night';
export type NetworkState = 'online' | 'offline';
export type DeviceViewMode = 'phone' | 'tablet';
export type OperationalStatus = 'Operando' | 'Detenido' | 'Mantenimiento';
