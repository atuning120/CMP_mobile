import { StyleSheet } from 'react-native';

// Atención de la alerta; el resto de la tarjeta usa los estilos de HistorialEventoCard
export const estilosAtencion = StyleSheet.create({
  registro: {
    gap: 4,
    borderLeftWidth: 3,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  texto: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  nota: {
    gap: 2,
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
  },
  autor: {
    fontSize: 11,
  },
  // Atención hecha sin señal que aún no llega al servidor
  envio: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  envioTexto: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '600',
  },
  descartar: {
    fontSize: 11,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  boton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  botonTexto: {
    fontSize: 13,
    fontWeight: '700',
  },
});
