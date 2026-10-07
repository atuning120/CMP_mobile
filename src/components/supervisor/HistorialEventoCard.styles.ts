import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  // Sombra de Android desactivada: sobre el vidrio oscuro deja un halo gris
  sinSombra: {
    elevation: 0,
    shadowOpacity: 0,
  },
  icono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cuerpo: {
    flex: 1,
    gap: 6,
  },
  titulo: {
    fontSize: 14,
    lineHeight: 20,
  },
  actor: {
    fontWeight: '700',
  },
  maquina: {
    fontWeight: '800',
  },
  motivo: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  motivoTexto: {
    fontSize: 12,
    fontWeight: '700',
  },
  observacion: {
    fontSize: 13,
    lineHeight: 18,
  },
  metaFila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  metaTexto: {
    fontSize: 12,
  },
  fecha: {
    fontSize: 11,
  },
});
