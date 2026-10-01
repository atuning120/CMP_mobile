import React, { useState, useMemo } from 'react';
import { View, Text, ImageBackground, useColorScheme, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { darkTheme, lightTheme } from '../constants/theme';
import { LoginHeader } from '../components/LoginHeader';
import { LoginFooter } from '../components/LoginFooter';
import { TurnoSummaryDropdown } from '../components/workzone/TurnoSummaryDropdown';
import { Sparkles, PlusCircle, Truck, History, ShieldAlert, RefreshCw } from 'lucide-react-native';
import { FleetSearchBar } from '../components/supervisor/FleetSearchBar';
import { FleetFilterChips, FilterOption } from '../components/supervisor/FleetFilterChips';
import { MachineFleetCard } from '../components/supervisor/MachineFleetCard';
import { useFlotaResumen, MaquinaFlota } from '../hooks/useFlotaResumen';
import { IncorporacionEquipoModal } from '../components/supervisor/IncorporacionEquipoModal';
import { ReemplazoEquipoModal } from '../components/supervisor/ReemplazoEquipoModal';
import { styles } from './ShipSupervisorScreen.styles';

type TabOption = 'FLOTA' | 'HISTORIAL' | 'ALERTAS';

export const ShipSupervisorScreen = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabOption>('FLOTA');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('Todos');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModificacionModalVisible, setIsModificacionModalVisible] = useState(false);

  const { maquinas, contadorFlota, isLoading } = useFlotaResumen();

  const handleLogout = () => {
    router.replace('/');
  };

  const handleSustituir = (maquina: MaquinaFlota) => {
    setIsModificacionModalVisible(true);
  };

  const handleEditar = (maquina: MaquinaFlota) => {
    Alert.alert("Editar Máquina", `Modificar datos de ${maquina.codigo} en desarrollo.`);
  };

  const handleHabilitar = (maquina: MaquinaFlota) => {
    Alert.alert(
      "Habilitar Máquina",
      `¿Confirmas que la máquina ${maquina.codigo} está lista para operar?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Habilitar", onPress: () => console.log('TODO: conectar con backend para habilitar') }
      ]
    );
  };

  const filteredMaquinas = useMemo(() => {
    return maquinas.filter(m => {
      const matchesSearch =
        m.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.patente.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.marcaModelo.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        activeFilter === 'Todos' ? true :
          activeFilter === 'Operativos' ? m.estadoOperativo === 'OPERATIVO' :
            activeFilter === 'Fuera de Servicio' ? m.estadoOperativo === 'FUERA_DE_SERVICIO' : true;

      return matchesSearch && matchesFilter;
    });
  }, [maquinas, searchQuery, activeFilter]);

  const renderTabs = () => (
    <View style={[styles.tabsContainer, { backgroundColor: theme.cardAlt }]}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'FLOTA' && { backgroundColor: theme.card }]}
        onPress={() => setActiveTab('FLOTA')}
        activeOpacity={0.7}
      >
        <View style={styles.tabIconRow}>
          <Truck size={16} color={activeTab === 'FLOTA' ? theme.warning : theme.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'FLOTA' ? theme.text : theme.textSecondary }]}>
            Flota
          </Text>
        </View>
        <Text style={[styles.tabCounter, { color: activeTab === 'FLOTA' ? theme.textSecondary : theme.textTertiary }]}>
          {contadorFlota} equipos
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'HISTORIAL' && { backgroundColor: theme.card }]}
        onPress={() => setActiveTab('HISTORIAL')}
        activeOpacity={0.7}
      >
        <View style={styles.tabIconRow}>
          <History size={16} color={activeTab === 'HISTORIAL' ? theme.primary : theme.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'HISTORIAL' ? theme.text : theme.textSecondary }]}>
            Historial
          </Text>
        </View>
        <Text style={[styles.tabCounter, { color: activeTab === 'HISTORIAL' ? theme.textSecondary : theme.textTertiary }]}>
          3 cambios
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'ALERTAS' && { backgroundColor: theme.card }]}
        onPress={() => setActiveTab('ALERTAS')}
        activeOpacity={0.7}
      >
        <View style={styles.tabIconRow}>
          <ShieldAlert size={16} color={activeTab === 'ALERTAS' ? theme.danger : theme.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'ALERTAS' ? theme.text : theme.textSecondary }]}>
            Alertas
          </Text>
        </View>
        <Text style={[styles.tabCounter, { color: activeTab === 'ALERTAS' ? theme.textSecondary : theme.textTertiary }]}>
          4 eventos
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (activeTab !== 'FLOTA') {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>Próximamente...</Text>
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <FleetSearchBar value={searchQuery} onChangeText={setSearchQuery} />
        <FleetFilterChips activeFilter={activeFilter} onFilterChange={setActiveFilter} />

        {isLoading ? (
          <ActivityIndicator size="large" color={theme.warning} style={{ marginTop: 40 }} />
        ) : (
          filteredMaquinas.map(maquina => (
            <MachineFleetCard
              key={maquina.id}
              maquina={maquina}
              onSustituir={handleSustituir}
              onEditar={handleEditar}
              onHabilitar={handleHabilitar}
            />
          ))
        )}

        {!isLoading && filteredMaquinas.length === 0 && (
          <Text style={{ textAlign: 'center', marginTop: 40, color: theme.textSecondary }}>No se encontraron máquinas.</Text>
        )}
      </View>
    );
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
              onPress={() => setIsModificacionModalVisible(true)}
            >
              <View style={styles.actionHeaderRow}>
                <View style={[styles.iconBadge, { backgroundColor: theme.warning + '20' }]}>
                  <RefreshCw size={16} color={theme.warning} />
                </View>
                <Text style={[styles.actionTopText, { color: theme.warning }]}>Relevo faena</Text>
              </View>
              <Text style={[styles.actionMainText, { color: theme.text }]}>Reemplazar (1 o 2)</Text>
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
              onPress={() => setIsModalVisible(true)}
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

          {renderTabs()}

          <View style={styles.tabContentCard}>
            {renderContent()}
          </View>
        </ScrollView>
      </ImageBackground>

      <LoginFooter />

      <IncorporacionEquipoModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      />

      <ReemplazoEquipoModal
        visible={isModificacionModalVisible}
        onClose={() => setIsModificacionModalVisible(false)}
      />
    </SafeAreaView>
  );
};

