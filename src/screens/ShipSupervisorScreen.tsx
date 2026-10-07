import React, { useState, useMemo } from 'react';
import { View, Text, ImageBackground, useColorScheme, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { darkTheme, lightTheme } from '../constants/theme';
import { LoginHeader } from '../components/LoginHeader';
import { LoginFooter } from '../components/LoginFooter';
import { TurnoSummaryDropdown } from '../components/workzone/TurnoSummaryDropdown';
import { PlusCircle, Truck, History, ShieldAlert, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { AppBottomSheetModal } from '../components/common/AppBottomSheetModal';
import { FleetSearchBar } from '../components/supervisor/FleetSearchBar';
import { FleetFilterChips, FilterOption } from '../components/supervisor/FleetFilterChips';
import { MachineFleetCard } from '../components/supervisor/MachineFleetCard';
import { useFlotaResumen, MaquinaFlota } from '../hooks/useFlotaResumen';
import { IncorporacionEquipoModal } from '../components/supervisor/IncorporacionEquipoModal';
import { ReemplazoEquipoModal } from '../components/supervisor/ReemplazoEquipoModal';
import { EditarEquipoModal } from '../components/supervisor/EditarEquipoModal';
import { styles } from './ShipSupervisorScreen.styles';
import { cerrarSesion } from '../services/authService';
import { ConfirmLogoutModal } from '../components/common/ConfirmLogoutModal';

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
  const [isEditarModalVisible, setIsEditarModalVisible] = useState(false);
  const [maquinaAEditar, setMaquinaAEditar] = useState<MaquinaFlota | null>(null);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [maquinaAToggle, setMaquinaAToggle] = useState<MaquinaFlota | null>(null);

  // La búsqueda la resuelve el Backend; el filtro por estado se aplica sobre el resultado
  const { maquinas, contadorFlota, isLoading, error, refetch, actualizarMaquina } = useFlotaResumen(searchQuery);

  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  const handleLogout = async () => {
    await cerrarSesion();
    setIsLogoutModalVisible(false);
    router.replace('/');
  };

  const handleSustituir = (maquina: MaquinaFlota) => {
    setIsModificacionModalVisible(true);
  };

  const handleEditar = (maquina: MaquinaFlota) => {
    setMaquinaAEditar(maquina);
    setIsEditarModalVisible(true);
  };

  const handleToggleEstado = (maquina: MaquinaFlota) => {
    setMaquinaAToggle(maquina);
    setIsConfirmModalVisible(true);
  };

  const filteredMaquinas = useMemo(
    () =>
      maquinas.filter(m =>
        activeFilter === 'Todos' ? true :
          activeFilter === 'Operativos' ? m.estadoOperativo === 'OPERATIVO' :
            activeFilter === 'Fuera de Servicio' ? m.estadoOperativo === 'FUERA_DE_SERVICIO' : true,
      ),
    [maquinas, activeFilter],
  );

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
        ) : error ? (
          <View style={{ alignItems: 'center', marginTop: 40, gap: 12 }}>
            <Text style={{ textAlign: 'center', color: theme.danger }}>{error.message}</Text>
            <TouchableOpacity onPress={refetch} style={{ backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : filteredMaquinas.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: theme.textSecondary }}>No se encontraron máquinas.</Text>
        ) : (
          filteredMaquinas.map(maquina => (
            <MachineFleetCard
              key={maquina.id}
              maquina={maquina}
              onSustituir={handleSustituir}
              onEditar={handleEditar}
              onToggleEstado={handleToggleEstado}
            />
          ))
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <LoginHeader showConnectionStatus />

      <ImageBackground
        source={require('../../assets/images/Mina_fondo.jpg')}
        style={styles.mainContent}
        imageStyle={{ opacity: colorScheme === 'dark' ? 0.3 : 0.9 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TurnoSummaryDropdown turno={null} onLogout={() => setIsLogoutModalVisible(true)} />

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
        onCreated={refetch}
      />

      <ReemplazoEquipoModal
        visible={isModificacionModalVisible}
        onClose={() => setIsModificacionModalVisible(false)}
      />

      <EditarEquipoModal
        visible={isEditarModalVisible}
        onClose={() => {
          setIsEditarModalVisible(false);
          setMaquinaAEditar(null);
        }}
        maquina={maquinaAEditar}
        onSave={(maquinaActualizada) => actualizarMaquina(maquinaActualizada)}
      />

      <AppBottomSheetModal
        visible={isConfirmModalVisible}
        onClose={() => { setIsConfirmModalVisible(false); setMaquinaAToggle(null); }}
        title={maquinaAToggle?.estadoOperativo === 'OPERATIVO' ? "Confirmar Deshabilitación" : "Confirmar Habilitación"}
        icon={<AlertTriangle size={22} color={theme.warning} />}
        iconBadgeColor={theme.warning + '15'}
        footer={
          <>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: theme.cardAlt, padding: 12, borderRadius: 8, alignItems: 'center' }}
              onPress={() => { setIsConfirmModalVisible(false); setMaquinaAToggle(null); }}
            >
              <Text style={{ color: theme.text, fontWeight: 'bold' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1, 
                backgroundColor: maquinaAToggle?.estadoOperativo === 'OPERATIVO' ? theme.danger : theme.success, 
                padding: 12, 
                borderRadius: 8, 
                alignItems: 'center', 
                flexDirection: 'row', 
                justifyContent: 'center', 
                gap: 8
              }}
              onPress={() => {
                if (maquinaAToggle) {
                  const isOperativo = maquinaAToggle.estadoOperativo === 'OPERATIVO';
                  actualizarMaquina({
                    ...maquinaAToggle,
                    estadoOperativo: isOperativo ? 'FUERA_DE_SERVICIO' : 'OPERATIVO',
                    fallaActiva: isOperativo ? 'Deshabilitado manualmente por Jefe de Turno' : null,
                  });
                  // TODO: conectar con el endpoint real de cambio de estado operacional cuando el backend lo exponga
                }
                setIsConfirmModalVisible(false);
                setMaquinaAToggle(null);
              }}
            >
              <CheckCircle size={18} color="#FFF" />
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
                {maquinaAToggle?.estadoOperativo === 'OPERATIVO' ? 'Deshabilitar' : 'Habilitar'}
              </Text>
            </TouchableOpacity>
          </>
        }
      >
        <Text style={{ color: theme.textSecondary, fontSize: 16, lineHeight: 24, textAlign: 'center', marginVertical: 16 }}>
          {maquinaAToggle?.estadoOperativo === 'OPERATIVO' 
            ? `¿Estás seguro de que deseas deshabilitar el equipo ${maquinaAToggle.codigo}? Pasará a estado "Fuera de Servicio".`
            : `¿Confirmas que el equipo ${maquinaAToggle?.codigo} está reparado y listo para operar?`}
        </Text>
      </AppBottomSheetModal>
      <ConfirmLogoutModal
        visible={isLogoutModalVisible}
        onCancel={() => setIsLogoutModalVisible(false)}
        onConfirm={handleLogout}
      />
    </SafeAreaView>
  );
};

