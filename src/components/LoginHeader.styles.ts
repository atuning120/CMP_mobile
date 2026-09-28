import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerRight: { alignItems: 'flex-end' },
  terminalText: {
    fontSize: 10,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    color: '#94a3b8',
    marginBottom: 2,
  },
  flotaContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flotaText: { fontSize: 12, fontWeight: 'bold', color: '#f59e0b' },
});

export const darkTheme = StyleSheet.create({
  borderBottom: { borderBottomColor: '#1e293b' },
});

export const lightTheme = StyleSheet.create({
  borderBottom: { borderBottomColor: '#e2e8f0' },
});
