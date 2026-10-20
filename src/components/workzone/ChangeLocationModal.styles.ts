import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
  actualZona: {
    fontSize: 13,
    marginTop: 2,
  },
  campo: {
    marginBottom: 16,
  },
  ayuda: {
    fontSize: 12,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  footerBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerBtnText: {
    fontWeight: 'bold',
  },
  footerBtnConfirm: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerBtnConfirmText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
