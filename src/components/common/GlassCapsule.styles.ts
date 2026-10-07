import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  capsula: {
    borderRadius: 20,
    borderWidth: 1,
    // Sin overflow hidden el BlurView ignora el borderRadius
    overflow: 'hidden',
    padding: 12,
  },
  velo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});
