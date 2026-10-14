import { useEffect, useState } from 'react';
import { leerOperadorCache, leerSesion } from '../services/authStorage';
import { Operador } from '../types/mining';

export interface PerfilVisible {
  nombre: string;
  apellido: string;
  // RUT del operador; un jefe de turno no tiene RUT y se muestra su correo
  detalle: string;
}

// Un jefe de turno trae el nombre completo en `nombre`: se separa para las iniciales del avatar
const perfilDe = (operador: Operador): PerfilVisible => {
  if (operador.apellido) return { nombre: operador.nombre, apellido: operador.apellido, detalle: operador.rut || operador.email };
  const [primero, ...resto] = operador.nombre.trim().split(/\s+/);
  return { nombre: primero ?? '', apellido: resto.join(' '), detalle: operador.rut || operador.email };
};

/**
 * Usuario que inició sesión en este teléfono, tal como lo guardó el último login con conexión.
 * Funciona sin red. null mientras se lee.
 */
export const useOperadorActual = (): PerfilVisible | null => {
  const [perfil, setPerfil] = useState<PerfilVisible | null>(null);

  useEffect(() => {
    let activo = true;
    (async () => {
      const operador = await leerOperadorCache();
      if (operador) {
        if (activo) setPerfil(perfilDe(operador));
        return;
      }
      // Sin perfil guardado (no debería pasar tras un login): al menos el correo o RUT con que ingresó
      const sesion = await leerSesion();
      if (activo && sesion) setPerfil({ nombre: sesion.identificador, apellido: '', detalle: '' });
    })().catch(() => undefined);
    return () => {
      activo = false;
    };
  }, []);

  return perfil;
};
