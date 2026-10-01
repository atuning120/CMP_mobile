import React from 'react';
import { View, Text, StyleSheet, ImageBackground, useColorScheme, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { darkTheme, lightTheme } from '../constants/theme';
import { LoginHeader } from '../components/LoginHeader';
import { LoginFooter } from '../components/LoginFooter';
import { TurnoSummaryDropdown } from '../components/workzone/TurnoSummaryDropdown';
import { Sparkles, PlusCircle } from 'lucide-react-native';

export const ShipSupervisorScreen = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();

  const handleLogout = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <LoginHeader />

      <ImageBackground
        source={require('../../assets/images/Mina_fondo.jpg')}
        style={styles.mainContent}
        imageStyle={{ opacity: colorScheme === 'dark' ? 0.3 : 0.9 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TurnoSummaryDropdown turno={null} onLogout={handleLogout} />

          <View style={styles.buttonsRow}>
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                { 
                  backgroundColor: theme.card, 
                  borderColor: theme.warning,
                  shadowColor: theme.warning 
                }
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.actionHeaderRow}>
                <View style={[styles.iconBadge, { backgroundColor: theme.warning + '20' }]}>
                  <Sparkles size={16} color={theme.warning} />
                </View>
                <Text style={[styles.actionTopText, { color: theme.warning }]}>DATOS PREVIOS</Text>
              </View>
              <Text style={[styles.actionMainText, { color: theme.text }]}>Solo Modificar</Text>
              <Text style={[styles.actionSubText, { color: theme.textSecondary }]}>Pre-carga modelo & datos</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.actionButton, 
                { 
                  backgroundColor: theme.card, 
                  borderColor: theme.primary,
                  shadowColor: theme.primary
                }
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.actionHeaderRow}>
                <View style={[styles.iconBadge, { backgroundColor: theme.primary + '20' }]}>
                  <PlusCircle size={16} color={theme.primary} />
                </View>
                <Text style={[styles.actionTopText, { color: theme.primary }]}>CREAR NUEVA</Text>
              </View>
              <Text style={[styles.actionMainText, { color: theme.text }]}>Desde Cero</Text>
              <Text style={[styles.actionSubText, { color: theme.textSecondary }]}>Formulario limpio</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ImageBackground>

      <LoginFooter />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    flexGrow: 1,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderBottomWidth: 4,
    justifyContent: 'center',
    alignItems: 'flex-start',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  actionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTopText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actionMainText: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  actionSubText: {
    fontSize: 11,
    fontWeight: '600',
  },
  card: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
