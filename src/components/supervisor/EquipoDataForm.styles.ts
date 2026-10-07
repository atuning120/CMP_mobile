import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
  },
  sourceSelectorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  sourceBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sourceBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 2,
  },
  sourceBtnSubtitle: {
    fontSize: 11,
  },
  sourceDataContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  sourceTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  plantillaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  plantillaHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  restaurarText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  chipsScroll: {
    gap: 8,
    paddingBottom: 8,
  },
  plantillaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipSubtext: {
    fontSize: 11,
    marginTop: 1,
  },
  plantillasEstado: {
    paddingVertical: 12,
  },
  plantillasMensaje: {
    fontSize: 13,
    paddingVertical: 8,
  },
  formSection: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldCol: {
    flex: 1,
  },
  fieldFull: {
    width: '100%',
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
  },
  operatorChip: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  operatorText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  operatorTurno: {
    fontSize: 11,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
  }
});
