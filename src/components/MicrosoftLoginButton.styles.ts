import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  msButton: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  msLogo: { width: 18, height: 18, gap: 1 },
  msLogoRow: { flexDirection: 'row', flex: 1, gap: 1 },
  msLogoSquare: { flex: 1 },
  msButtonText: { fontSize: 14, fontWeight: 'bold' },
});
