import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 12,
  },
  etiqueta: {
    fontSize: 15,
    fontWeight: '600',
  },
  selector: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selectorTexto: {
    fontSize: 15,
    fontWeight: '600',
  },
  mensaje: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  boton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  botonTexto: {
    fontWeight: 'bold',
  },
});
