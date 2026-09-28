import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LogOut } from 'lucide-react-native';

export default function WorkzoneScreen() {
  const router = useRouter();

  const handleLogout = () => {
    // Navigate back to the index (login) screen
    router.replace('/');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A1017', justifyContent: 'space-between' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center' }}>
          ¡Bienvenido a la Zona de Trabajo!
        </Text>
        <Text style={{ fontSize: 16, color: '#94a3b8', textAlign: 'center', marginTop: 10 }}>
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
            borderColor: 'rgba(244, 63, 94, 0.4)',
            borderWidth: 1,
            paddingVertical: 14,
            borderRadius: 12,
            gap: 10
          }}
        >
          <LogOut size={20} color="#f87171" />
          <Text style={{ color: '#f87171', fontSize: 16, fontWeight: 'bold' }}>
            Cerrar Sesión
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
