import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  contenedor: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  // 44 px de alto: se tocan con guantes
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 22,
  },
  chipTexto: {
    fontSize: 14,
    fontWeight: '600',
  },
  resumen: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
  },
  resumenTexto: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
