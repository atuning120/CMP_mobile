import React from 'react';
import { View, Text, StyleSheet, ImageBackground, useColorScheme, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { darkTheme, lightTheme } from '../constants/theme';
import { LoginHeader } from '../components/LoginHeader';
import { LoginFooter } from '../components/LoginFooter';

export const ShipSupervisorScreen = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <LoginHeader />

        <ImageBackground
          source={require('../../assets/images/Mina_fondo.jpg')}
          style={styles.mainContent}
          imageStyle={{ opacity: colorScheme === 'dark' ? 0.6 : 0.6 }}
        >
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>Panel de Supervisor</Text>
            <Text style={{ color: theme.textSecondary, marginTop: 16 }}>
              Esta pantalla está actualmente en construcción.
            </Text>
          </View>
        </ImageBackground>

        <LoginFooter />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
