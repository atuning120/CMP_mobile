import { StyleSheet } from 'react-native';

export const OPCIONES_MAX_HEIGHT = 260;

export const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 48,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 12,
  },
  iconButton: {
    padding: 4,
  },
  hint: {
    fontSize: 11,
    marginTop: 6,
  },
  // La lista se despliega en línea (no absoluta): en Android los toques fuera de los límites del padre se pierden
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  dropdownHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  optionsScroll: {
    maxHeight: OPCIONES_MAX_HEIGHT,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  optionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionTexts: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
  },
  optionDescription: {
    fontSize: 11,
    marginTop: 2,
  },
  highlight: {
    fontWeight: '800',
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 8,
  },
  stateText: {
    fontSize: 13,
    textAlign: 'center',
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
