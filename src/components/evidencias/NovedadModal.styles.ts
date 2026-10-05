import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  foto: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    marginBottom: 16,
  },
  etiqueta: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  descripcion: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 96,
  },
  contador: {
    textAlign: 'right',
    fontSize: 10,
    marginTop: 6,
    fontWeight: '500',
  },
  error: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  botonSecundario: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonSecundarioTexto: {
    fontWeight: 'bold',
  },
  botonPrimario: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonPrimarioTexto: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
