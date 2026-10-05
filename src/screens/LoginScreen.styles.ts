import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'space-between' },

  mainContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  titleContainer: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4, alignContent: 'center' },
  subtitle: { fontSize: 14 },

  label: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },

  quickSelectSection: { marginBottom: 20 },
  quickSelectGrid: { flexDirection: 'row', gap: 8 },
  quickOpButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontWeight: 'bold' },
  quickOpInfo: { flex: 1 },
  quickOpName: { fontSize: 12, fontWeight: 'bold' },
  quickOpRut: { fontSize: 10, fontFamily: 'monospace' },


  offlineNotice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  offlineLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  offlineText: { fontSize: 11 },
  networkStatusText: { fontSize: 11, fontFamily: 'monospace' },
});
