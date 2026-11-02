import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
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
    gap: 2,
  },
  descripcion: {
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
  },
  motivo: {
    fontSize: 13,
    lineHeight: 18,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  botones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  boton: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  botonTexto: {
    fontSize: 13,
    fontWeight: '700',
  },
});
