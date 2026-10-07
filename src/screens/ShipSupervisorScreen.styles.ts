import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  fondo: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  scrollContainer: {
    padding: 16,
    // Espacio para que el botón flotante no tape la última tarjeta
    paddingBottom: 96,
    flexGrow: 1,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderBottomWidth: 4,
    justifyContent: 'center',
    alignItems: 'flex-start',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  actionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTopText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actionMainText: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  actionSubText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    borderRadius: 16,
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 4,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  tabIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabCounter: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabContentCard: {
    paddingTop: 16,
    marginTop: 8,
    minHeight: 300,
  },
  placeholderContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 16,
    fontStyle: 'italic',
  }
});
