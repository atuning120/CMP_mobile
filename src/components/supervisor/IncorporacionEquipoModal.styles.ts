import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  headerTopBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)', // Light primary color for contrast
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  headerTopText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
  },
  capsuleSection: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  qtyCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    position: 'relative',
  },
  qtyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  qtyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  qtySubtitle: {
    fontSize: 11,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  tabText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabContent: {
  },
  fieldFull: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
  },
  authBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  authText: {
    fontSize: 12,
  },
  btnSecundario: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSecundarioText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  btnPrimario: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnPrimarioText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
