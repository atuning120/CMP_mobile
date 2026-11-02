import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  fondo: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  encabezado: {
    flex: 1,
    gap: 2,
  },
  titulo: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitulo: {
    fontSize: 13,
  },
  cerrar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lista: {
    flex: 1,
  },
  pagina: {
    flex: 1,
    justifyContent: 'center',
  },
  foto: {
    width: '100%',
    height: '100%',
  },
  descripcion: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
});
