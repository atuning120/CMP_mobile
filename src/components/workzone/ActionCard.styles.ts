import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    minWidth: 100,
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    textAlign: 'center',
  }
});
