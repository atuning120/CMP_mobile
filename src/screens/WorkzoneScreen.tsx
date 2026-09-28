import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { lightTheme, darkTheme } from '../constants/theme';

export default function WorkzoneScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const handleLogout = () => {
    // Navigate back to the index (login) screen
    router.replace('/');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'space-between' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text, textAlign: 'center' }}>
          ¡Bienvenido a la Zona de Trabajo!
        </Text>
        <Text style={{ fontSize: 16, color: theme.textSecondary, textAlign: 'center', marginTop: 10 }}>
          Próximamente se implementarán las funcionalidades operativas aquí.
        </Text>
      </View>

      <View style={{ padding: 20, paddingBottom: 40 }}>
        <TouchableOpacity 
          onPress={handleLogout}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(244, 63, 94, 0.15)',
            borderColor: theme.danger,
            borderWidth: 1,
            paddingVertical: 14,
            borderRadius: 12,
            gap: 10
          }}
        >
          <LogOut size={20} color={theme.danger} />
          <Text style={{ color: theme.danger, fontSize: 16, fontWeight: 'bold' }}>
            Cerrar Sesión
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
