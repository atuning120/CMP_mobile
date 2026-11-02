import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  themeToggle: { padding: 8, borderRadius: 20, borderWidth: 1 },
  // Conexión y sincronización en su propia fila: arriba sólo va la marca y no se aprietan en pantallas angostas
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
});
