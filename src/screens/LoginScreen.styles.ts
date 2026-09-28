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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  titleContainer: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
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
  quickOpSelected: {
    borderColor: '#00A3E0',
    backgroundColor: 'rgba(0, 163, 224, 0.15)',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: { backgroundColor: '#00A3E0' },
  avatarUnselected: { backgroundColor: '#334155' },
  avatarText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  quickOpInfo: { flex: 1 },
  quickOpName: { fontSize: 12, fontWeight: 'bold' },
  quickOpRut: { fontSize: 10, fontFamily: 'monospace' },
  
  dividerContainer: { marginVertical: 24, alignItems: 'center', justifyContent: 'center' },
  dividerLine: { position: 'absolute', width: '100%', borderTopWidth: 1 },
  dividerTextWrapper: { paddingHorizontal: 10 },
  dividerText: { fontSize: 11, textTransform: 'uppercase', color: '#94a3b8' },
  
  offlineNotice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  offlineLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  offlineText: { fontSize: 11, color: '#94a3b8' },
  networkStatusText: { fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' },
  
  textWhite: { color: '#fff' },
  textWhiteOpacity: { color: 'rgba(255,255,255,0.7)' },
});

export const darkTheme = StyleSheet.create({
  background: { backgroundColor: '#0A1017' },
  cardBackground: { backgroundColor: '#101824' },
  cardBorder: { borderColor: '#1e293b' },
  borderBottom: { borderBottomColor: '#1e293b' },
  textPrimary: { color: '#ffffff' },
  textSecondary: { color: '#94a3b8' },
  textTertiary: { color: '#64748b' },
  quickOpUnselected: { backgroundColor: 'rgba(15, 23, 42, 0.6)', borderColor: '#1e293b' },
});

export const lightTheme = StyleSheet.create({
  background: { backgroundColor: '#f1f5f9' },
  cardBackground: { backgroundColor: '#ffffff' },
  cardBorder: { borderColor: '#e2e8f0' },
  borderBottom: { borderBottomColor: '#e2e8f0' },
  textPrimary: { color: '#0f172a' },
  textSecondary: { color: '#64748b' },
  textTertiary: { color: '#94a3b8' },
  quickOpUnselected: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
});
