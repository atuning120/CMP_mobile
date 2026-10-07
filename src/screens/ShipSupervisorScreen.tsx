import React, { useState, useMemo, useRef } from 'react';
import { View, Text, Image, NativeScrollEvent, NativeSyntheticEvent, useColorScheme, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { darkTheme, lightTheme } from '../constants/theme';
import { LoginHeader } from '../components/LoginHeader';
import { LoginFooter } from '../components/LoginFooter';
import { TurnoSummaryDropdown } from '../components/workzone/TurnoSummaryDropdown';
import { Truck, History, ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react-native';
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
import { GlassCapsule } from '../components/common/GlassCapsule';
import { NuevaMaquinaFab } from '../components/supervisor/NuevaMaquinaFab';
import { HistorialEventoCard } from '../components/supervisor/HistorialEventoCard';
import { useHistorial } from '../hooks/useHistorial';
import type { FiltroHistorial } from '../services/historialService';

type TabOption = 'FLOTA' | 'HISTORIAL' | 'ALERTAS';

const FILTROS_HISTORIAL = ['Todo', 'Turnos', 'Flota'] as const;
type FiltroHistorialUI = (typeof FILTROS_HISTORIAL)[number];
const FILTRO_HISTORIAL_API: Record<FiltroHistorialUI, FiltroHistorial> = { Todo: 'TODO', Turnos: 'TURNOS', Flota: 'FLOTA' };

export const ShipSupervisorScreen = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  // Fondo que difumina la cápsula de la flota (en Android el BlurView necesita esta referencia)
  const fondoRef = useRef<View | null>(null);
  // El botón flotante se contrae al bajar por la lista y vuelve a mostrar su etiqueta al subir
  const [fabExpandido, setFabExpandido] = useState(true);
  const ultimoScrollY = useRef(0);
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const delta = y - ultimoScrollY.current;
    ultimoScrollY.current = y;
    if (y < 40) setFabExpandido(true);
    else if (Math.abs(delta) > 6) setFabExpandido(delta < 0);
  };
  const [tamanoFondo, setTamanoFondo] = useState<{ width: number; height: number } | null>(null);

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

  const [filtroHistorial, setFiltroHistorial] = useState<FiltroHistorialUI>('Todo');
  const historial = useHistorial(FILTRO_HISTORIAL_API[filtroHistorial]);

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
        onPress={() => {
          // Al entrar se recarga: pueden haber turnos nuevos de los operadores
          if (activeTab !== 'HISTORIAL') historial.refetch();
          setActiveTab('HISTORIAL');
        }}
        activeOpacity={0.7}
      >
        <View style={styles.tabIconRow}>
          <History size={16} color={activeTab === 'HISTORIAL' ? theme.primary : theme.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'HISTORIAL' ? theme.text : theme.textSecondary }]}>
            Historial
          </Text>
        </View>
        <Text style={[styles.tabCounter, { color: activeTab === 'HISTORIAL' ? theme.textSecondary : theme.textTertiary }]}>
          {historial.isLoading && historial.eventos.length === 0
            ? 'Cargando...'
            : `${historial.eventos.length}${historial.hayMas ? '+' : ''} eventos`}
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

  const renderHistorial = () => (
    <GlassCapsule blurTarget={fondoRef}>
      <FleetFilterChips filters={FILTROS_HISTORIAL} activeFilter={filtroHistorial} onFilterChange={setFiltroHistorial} />

      {historial.isLoading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
      ) : historial.error && historial.eventos.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 40, gap: 12 }}>
          <Text style={{ textAlign: 'center', color: theme.danger }}>{historial.error}</Text>
          <TouchableOpacity onPress={historial.refetch} style={{ backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}>
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : historial.eventos.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 40, color: theme.textSecondary }}>Aún no hay eventos registrados.</Text>
      ) : (
        <>
          {historial.eventos.map(evento => (
            <HistorialEventoCard key={evento.id} evento={evento} />
          ))}
          {historial.hayMas && (
            <TouchableOpacity
              onPress={historial.cargarMas}
              disabled={historial.isLoadingMas}
              style={[styles.cargarMas, { borderColor: theme.glassSurfaceBorder, backgroundColor: theme.glassSurface }]}
            >
              {historial.isLoadingMas ? (
                <ActivityIndicator color={theme.primary} />
              ) : (
                <Text style={[styles.cargarMasTexto, { color: theme.primary }]}>Cargar eventos anteriores</Text>
              )}
            </TouchableOpacity>
          )}
        </>
      )}
    </GlassCapsule>
  );

  const renderContent = () => {
    if (activeTab === 'HISTORIAL') return renderHistorial();
    if (activeTab !== 'FLOTA') {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>Próximamente...</Text>
        </View>
      );
    }

    return (
      <GlassCapsule blurTarget={fondoRef}>
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
      </GlassCapsule>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <LoginHeader showConnectionStatus />

      <View
        style={styles.mainContent}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setTamanoFondo((prev) => (prev?.width === width && prev?.height === height ? prev : { width, height }));
        }}
      >
        {/* El fondo va en un BlurTargetView aparte (no envuelve al contenido) para que la cápsula lo pueda difuminar.
            Se le da el tamaño exacto del contenedor: dentro del BlurTargetView nativo la imagen debe recortarse
            igual que con ImageBackground y no según su tamaño propio */}
        {tamanoFondo && (
          // El color de fondo y el velo van dentro del target: el blur solo ve lo que hay aquí y en Android
          // ignora la opacidad de la imagen, por eso el oscurecimiento es una capa y no opacity
          <BlurTargetView ref={fondoRef} style={[styles.fondo, tamanoFondo, { backgroundColor: theme.background }]}>
            <Image source={require('../../assets/images/Mina_fondo.jpg')} style={[styles.fondo, tamanoFondo]} resizeMode="cover" />
            <View style={[styles.fondo, tamanoFondo, { backgroundColor: theme.backgroundVeil }]} />
          </BlurTargetView>
        )}
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <TurnoSummaryDropdown turno={null} onLogout={() => setIsLogoutModalVisible(true)} />

          {renderTabs()}

          <View style={styles.tabContentCard}>
            {renderContent()}
          </View>
        </ScrollView>

        {/* Botón flotante: queda fijo sobre el contenido, dentro del área que termina en el footer */}
        <NuevaMaquinaFab expandido={fabExpandido} onPress={() => setIsModalVisible(true)} />
      </View>

      <LoginFooter />

      <IncorporacionEquipoModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onCreated={() => {
          refetch();
          historial.refetch();
        }}
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

