import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  miniatura: {
    width: 72,
    height: 72,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  foto: {
    width: '100%',
    height: '100%',
  },
});
