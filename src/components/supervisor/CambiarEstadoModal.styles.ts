import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  pregunta: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginVertical: 12,
  },
  campo: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
  },
  errorCaja: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  errorTexto: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  boton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  botonConIcono: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  botonTexto: {
    fontWeight: 'bold',
  },
});
