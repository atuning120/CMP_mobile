import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  tarjetaAnimada: {
    width: '100%',
    maxWidth: 400,
  },
  tarjeta: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  icono: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  mensaje: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  resumen: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  filaEtiqueta: {
    fontSize: 13,
  },
  filaValor: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  avisoTexto: {
    fontSize: 12,
  },
  boton: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonTexto: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
