import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  icono: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textos: {
    flex: 1,
  },
  titulo: {
    fontSize: 13,
    fontWeight: '700',
  },
  detalle: {
    fontSize: 12,
    marginTop: 1,
  },
  reintentar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  reintentarTexto: {
    fontSize: 12,
    fontWeight: '600',
  },
});
