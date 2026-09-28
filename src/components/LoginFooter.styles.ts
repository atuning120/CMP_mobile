import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 11, color: '#94a3b8' },
});

export const darkTheme = StyleSheet.create({
  borderTop: { borderTopColor: '#1e293b' },
});

export const lightTheme = StyleSheet.create({
  borderTop: { borderTopColor: '#e2e8f0' },
});
