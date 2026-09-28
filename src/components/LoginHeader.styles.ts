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
    marginBottom: 2,
  },
  flotaContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flotaText: { fontSize: 12, fontWeight: 'bold' },
});
