import { useNetInfo } from '@react-native-community/netinfo';
import { Moon, Sun, Wifi, WifiOff } from 'lucide-react-native';
import React from 'react';
import { Appearance, TouchableOpacity, useColorScheme, View } from 'react-native';
import { darkTheme, lightTheme, ThemeColors } from '../constants/theme';
import { CmpLogo } from './CmpLogo';
import { GeoPlantaBrand } from './GeoPlantaBrand';
import { styles } from './LoginHeader.styles';
import { StatusChip } from './StatusChip';
import { SyncIndicator } from './SyncIndicator';

export interface LoginHeaderProps {
  showConnectionStatus?: boolean;
  // Registros pendientes de subir al servidor (pantallas del operador)
  showSyncStatus?: boolean;
}

const ConnectionChip: React.FC<{ theme: ThemeColors }> = ({ theme }) => {
  const netInfo = useNetInfo();
  // Mismo criterio que motorSync: un WiFi sin salida a internet no cuenta como conectado
  const conectado = netInfo.isConnected === true && netInfo.isInternetReachable !== false;

  return conectado ? (
    <StatusChip theme={theme} icon={Wifi} iconColor={theme.success} textColor={theme.successText} label="Conectado" />
  ) : (
    <StatusChip theme={theme} icon={WifiOff} iconColor={theme.danger} textColor={theme.dangerText} label="Sin conexión" />
  );
};

export const LoginHeader: React.FC<LoginHeaderProps> = ({ showConnectionStatus = false, showSyncStatus = false }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => {
    Appearance.setColorScheme(isDark ? 'light' : 'dark');
  };

  return (
    <View style={[styles.header, { borderBottomColor: theme.border }]}>
      <View style={styles.topRow}>
        <GeoPlantaBrand theme={theme} />
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.themeToggle, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
            accessibilityRole="button"
            accessibilityLabel={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            {isDark ? <Sun size={18} color={theme.warning} /> : <Moon size={18} color={theme.primary} />}
          </TouchableOpacity>
          <CmpLogo variant={isDark ? 'dark' : 'auto'} />
        </View>
      </View>
      {(showConnectionStatus || showSyncStatus) && (
        <View style={styles.statusRow}>
          {showConnectionStatus && <ConnectionChip theme={theme} />}
          {showSyncStatus && <SyncIndicator theme={theme} />}
        </View>
      )}
    </View>
  );
};
