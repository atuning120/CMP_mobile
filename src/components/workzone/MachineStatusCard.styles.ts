import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginVertical: 12,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  machineInfo: {
    flex: 1,
    marginRight: 8,
  },
  machineName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  secondaryText: {
    fontSize: 14,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 12,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  stateBlock: {
    flex: 1,
    minWidth: 150,
  },
  durationBlock: {
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stateValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  stateName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  durationValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardCompact: {
    padding: 12,
    marginVertical: 0,
    borderWidth: 0,
    borderRadius: 12,
  },
  topSectionCompact: {
    marginBottom: 8,
  },
  badgeCompact: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginRight: 8,
  },
  badgeTextCompact: {
    fontSize: 11,
  },
  machineNameCompact: {
    fontSize: 14,
    marginBottom: 2,
  },
  secondaryTextCompact: {
    fontSize: 11,
  },
  statusPillCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusPillTextCompact: {
    fontSize: 10,
  },
  dividerCompact: {
    marginVertical: 8,
  },
  dotCompact: {
    width: 6,
    height: 6,
    marginRight: 6,
  },
  stateNameCompact: {
    fontSize: 14,
  },
  durationValueCompact: {
    fontSize: 14,
  },
});
