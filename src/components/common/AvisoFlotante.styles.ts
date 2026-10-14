import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // Sobre todas las pantallas y capas; no bloquea los toques fuera de la cápsula. Sin fondo: una vista
  // translúcida con elevation dejaría ver su sombra a través (en Android)
  contenedor: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 1000,
    alignItems: 'center',
  },
  animado: {
    width: '100%',
    maxWidth: 460,
  },
  capsula: {
    overflow: 'hidden',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 18,
  },
  circulo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textos: {
    flex: 1,
  },
  mensaje: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  detalle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  // Línea inferior que se vacía mientras el aviso sigue visible
  pista: {
    height: 3,
    backgroundColor: 'rgba(127, 127, 127, 0.18)',
  },
  progreso: {
    height: 3,
    width: '100%',
    transformOrigin: 'left',
  },
});
