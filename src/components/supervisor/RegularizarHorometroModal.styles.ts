import { StyleSheet } from 'react-native';

// Mismo formato que AtenderAlertaModal
export const styles = StyleSheet.create({
  etiqueta: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  etiquetaComentario: {
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  ayuda: {
    fontSize: 12,
    marginTop: 6,
  },
  comentario: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 72,
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
    paddingHorizontal: 12,
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
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonPrimarioTexto: {
    // Si no cabe (pantalla angosta o letra grande del sistema) se achica en vez de salirse
    flexShrink: 1,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
