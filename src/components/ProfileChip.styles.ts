import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  quickOpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    paddingRight: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  quickOpInfo: {
    justifyContent: 'center',
  },
  quickOpName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickOpRut: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
});
