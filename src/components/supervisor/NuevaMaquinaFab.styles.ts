import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  boton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    height: 56,
    minWidth: 56,
    borderRadius: 28,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    // Borde claro sutil: da el canto iluminado que separa el botón del fondo
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
  },
  botonExtendido: {
    paddingRight: 20,
  },
  icono: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  etiqueta: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginLeft: 10,
  },
});
