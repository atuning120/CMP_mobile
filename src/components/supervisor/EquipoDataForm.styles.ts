import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
  },
  sourceSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  sourceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  sourceBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  sourceDataContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  sourceTitle: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  chipsScroll: {
    gap: 8,
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
