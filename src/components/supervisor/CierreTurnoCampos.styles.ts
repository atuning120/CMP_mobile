import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  caja: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  icono: {
    marginTop: 1,
  },
  texto: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  negrita: {
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 17,
    fontWeight: '600',
  },
  ayuda: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
  },
});
