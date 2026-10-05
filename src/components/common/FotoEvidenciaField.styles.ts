import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  boton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderStyle: 'dashed',
    gap: 12,
    marginBottom: 8,
  },
  iconoBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  titulo: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 12,
    textAlign: 'center',
  },
  vistaPrevia: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    gap: 12,
    marginBottom: 8,
  },
  miniatura: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  acciones: {
    flex: 1,
    gap: 8,
  },
  accion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accionTexto: {
    fontSize: 13,
    fontWeight: '600',
  },
});
