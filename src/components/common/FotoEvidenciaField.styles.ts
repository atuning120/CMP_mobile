import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  tarjeta: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    minHeight: 60,
  },
  iconoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filaTextos: {
    flex: 1,
  },
  filaTitulo: {
    fontSize: 14,
    fontWeight: '600',
  },
  filaDetalle: {
    fontSize: 12,
    marginTop: 2,
  },
  ayuda: {
    fontSize: 12,
    marginTop: 6,
    marginBottom: 8,
    marginHorizontal: 2,
  },
  vistaPrevia: {
    flexDirection: 'row',
    padding: 10,
    gap: 12,
  },
  miniatura: {
    width: 84,
    height: 84,
    borderRadius: 8,
  },
  vistaPreviaCuerpo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  estado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  estadoTexto: {
    fontSize: 14,
    fontWeight: '600',
  },
  estadoDetalle: {
    fontSize: 12,
  },
  acciones: {
    flexDirection: 'row',
    gap: 8,
  },
  accion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  accionIcono: {
    paddingHorizontal: 8,
  },
  accionTexto: {
    fontSize: 12,
    fontWeight: '600',
  },
});
