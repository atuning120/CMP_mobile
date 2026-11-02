import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  contenido: {
    padding: 16,
    paddingBottom: 40,
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  volver: {
    padding: 4,
    marginLeft: -4,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitulo: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  seccion: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 10,
  },
  vacio: {
    fontSize: 13,
    marginBottom: 14,
  },
  enviarAhora: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    marginBottom: 14,
  },
  enviarAhoraTexto: {
    fontSize: 13,
    fontWeight: '700',
  },
  registro: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  registroTextos: {
    flex: 1,
    gap: 2,
  },
  registroTitulo: {
    fontSize: 13,
    fontWeight: '600',
  },
  registroDetalle: {
    fontSize: 12,
    lineHeight: 17,
  },
});
