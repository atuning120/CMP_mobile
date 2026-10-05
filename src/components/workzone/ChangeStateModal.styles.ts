import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  headerTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  actual: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
    gap: 12,
  },
  actualTextos: {
    flex: 1,
  },
  actualEtiqueta: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  actualNombre: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  actualTiempo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actualTiempoTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  vacio: {
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 24,
  },
  seccion: {
    marginBottom: 18,
  },
  seccionEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seccionPunto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  seccionTitulo: {
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
  },
  seccionConteo: {
    fontSize: 12,
    fontWeight: '600',
  },
  seccionAyuda: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 10,
    marginLeft: 16,
  },
  grilla: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  tarjeta: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    minHeight: 104,
  },
  tarjetaActiva: {
    borderWidth: 2,
  },
  tarjetaArriba: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  icono: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonInfo: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tarjetaTitulo: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  tarjetaDescripcion: {
    fontSize: 11,
    lineHeight: 15,
  },
  badgeActivo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    marginTop: 8,
  },
  badgeActivoTexto: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
