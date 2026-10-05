import { useNetInfo } from '@react-native-community/netinfo';
import { HardHat, Moon, Sun, Wifi, WifiOff } from 'lucide-react-native';
import React from 'react';
import { Appearance, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { darkTheme, lightTheme } from '../constants/theme';
import { CmpLogo } from './CmpLogo';
import { styles } from './LoginHeader.styles';
import { SyncIndicator } from './SyncIndicator';

export interface LoginHeaderProps {
  showConnectionStatus?: boolean;
  // Registros pendientes de subir al servidor (pantallas del operador)
  showSyncStatus?: boolean;
}

export const LoginHeader: React.FC<LoginHeaderProps> = ({ showConnectionStatus = false, showSyncStatus = false }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const netInfo = useNetInfo();

  const toggleTheme = () => {
    Appearance.setColorScheme(isDark ? 'light' : 'dark');
  };

  return (
    <View style={[styles.header, { borderBottomColor: theme.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CmpLogo variant={isDark ? 'dark' : 'auto'} />
        <TouchableOpacity
          onPress={toggleTheme}
          style={{
            padding: 8,
            borderRadius: 20,
            backgroundColor: theme.cardAlt,
            borderWidth: 1,
            borderColor: theme.border
          }}
        >
          {isDark ? (
            <Sun size={18} color={theme.warning} />
          ) : (
            <Moon size={18} color={theme.primary} />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.headerRight}>
        <View style={styles.flotaContainer}>
          <HardHat size={14} color={theme.warning} />
          <Text style={[styles.flotaText, { color: theme.warning }]}>Sistema en Cabina MLC</Text>
        </View>
        {showConnectionStatus && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, gap: 4 }}>
            {netInfo.isConnected ? (
              <>
                <Wifi size={12} color={theme.success} />
                <Text style={{ color: theme.success, fontSize: 10, fontWeight: '500' }}>
                  Conectado {netInfo.type === 'wifi' ? '(WiFi)' : netInfo.type === 'cellular' ? '(Móvil)' : ''}
                </Text>
              </>
            ) : (
              <>
                <WifiOff size={12} color={theme.danger} />
                <Text style={{ color: theme.danger, fontSize: 10, fontWeight: '500' }}>Sin conexión</Text>
              </>
            )}
          </View>
        )}
        {showSyncStatus && <SyncIndicator theme={theme} />}
      </View>
    </View>
  );
};
