import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Alert, View, Text, Image, NativeScrollEvent, NativeSyntheticEvent, useColorScheme, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { darkTheme, lightTheme } from '../constants/theme';
import { LoginHeader } from '../components/LoginHeader';
import { LoginFooter } from '../components/LoginFooter';
import { TurnoSummaryDropdown } from '../components/workzone/TurnoSummaryDropdown';
import { Truck, History, ShieldAlert, AlertTriangle, LayoutList, UserRound, AlarmClockOff, CheckCircle, CircleDashed, Layers, Wrench } from 'lucide-react-native';
import { CambiarEstadoModal } from '../components/supervisor/CambiarEstadoModal';
import { FleetSearchBar } from '../components/supervisor/FleetSearchBar';
import { FleetFilterChips, FilterOption } from '../components/supervisor/FleetFilterChips';
import { MachineFleetCard } from '../components/supervisor/MachineFleetCard';
import { useFlotaResumen, MaquinaFlota } from '../hooks/useFlotaResumen';
import { IncorporacionEquipoModal } from '../components/supervisor/IncorporacionEquipoModal';
import { ReemplazoEquipoModal } from '../components/supervisor/ReemplazoEquipoModal';
import { DevolverEquipoModal } from '../components/supervisor/DevolverEquipoModal';
import { EditarEquipoModal } from '../components/supervisor/EditarEquipoModal';
import { styles } from './ShipSupervisorScreen.styles';
import { cerrarSesion } from '../services/authService';
import { ConfirmLogoutModal } from '../components/common/ConfirmLogoutModal';
import { GlassCapsule } from '../components/common/GlassCapsule';
import { NuevaMaquinaFab } from '../components/supervisor/NuevaMaquinaFab';
import { HistorialEventoCard } from '../components/supervisor/HistorialEventoCard';
import { useHistorial } from '../hooks/useHistorial';
import type { FiltroHistorial } from '../services/historialService';
import { SegmentedControl } from '../components/supervisor/SegmentedControl';
import { RangoFechasFiltro } from '../components/supervisor/RangoFechasFiltro';
import { ListaPorDia } from '../components/supervisor/ListaPorDia';
import { AlertaCard } from '../components/supervisor/AlertaCard';
import { AtenderAlertaModal } from '../components/supervisor/AtenderAlertaModal';
import { useRangoFechas } from '../hooks/useRangoFechas';
import { useAlertas } from '../hooks/useAlertas';
import { useRecargaManual } from '../hooks/useRecargaManual';
import { AvisoDatosGuardados } from '../components/supervisor/AvisoDatosGuardados';
import type { Alerta, EstadoAtencion, FiltroAlertas } from '../services/alertasService';
import { descartarAtencionPendiente } from '../services/accionesJefe';
import { useConectado } from '../hooks/useConectado';

type TabOption = 'FLOTA' | 'HISTORIAL' | 'ALERTAS';

type FiltroHistorialUI = 'Todo' | 'Turnos' | 'Flota';
// "Sin operador" se cruza con cualquier estado: una máquina en reserva también puede estar sin operador
const FILTRO_FLOTA: Record<FilterOption, (m: MaquinaFlota) => boolean> = {
  Todos: () => true,
  Operativos: (m) => m.estado === 'ACTIVA',
  'Bajo observación': (m) => m.estado === 'BAJO_OBSERVACION',
  'En mantenimiento': (m) => m.estado === 'EN_MANTENIMIENTO',
  'En reserva': (m) => m.estado === 'EN_RESERVA',
  'Sin operador': (m) => m.sinOperador,
  'Fuera de Servicio': (m) => m.estado === 'BAJA',
};

const FILTROS_HISTORIAL = [
  { valor: 'Todo', icono: LayoutList },
  { valor: 'Turnos', icono: UserRound },
  { valor: 'Flota', icono: Truck },
] as const satisfies readonly { valor: FiltroHistorialUI; icono: unknown }[];
const FILTRO_HISTORIAL_API: Record<FiltroHistorialUI, FiltroHistorial> = { Todo: 'TODO', Turnos: 'TURNOS', Flota: 'FLOTA' };

type FiltroAlertasUI = 'Todas' | '+10 horas' | 'Cierre auto' | 'Mantención';
const FILTROS_ALERTAS = [
  { valor: 'Todas', icono: ShieldAlert },
  { valor: '+10 horas', icono: AlertTriangle },
  { valor: 'Cierre auto', icono: AlarmClockOff },
  { valor: 'Mantención', icono: Wrench },
] as const satisfies readonly { valor: FiltroAlertasUI; icono: unknown }[];
const FILTRO_ALERTAS_API: Record<FiltroAlertasUI, FiltroAlertas> = {
  Todas: 'TODO',
  '+10 horas': 'EXTENDIDOS',
  'Cierre auto': 'CIERRES_AUTOMATICOS',
  Mantención: 'MANTENCIONES',
};
// Si alguien ya atendió la alerta
type EstadoAtencionUI = 'Cualquiera' | 'Pendientes' | 'Atendidas';
const ESTADOS_ATENCION = [
  { valor: 'Cualquiera', icono: Layers },
  { valor: 'Pendientes', icono: CircleDashed },
  { valor: 'Atendidas', icono: CheckCircle },
] as const satisfies readonly { valor: EstadoAtencionUI; icono: unknown }[];
const ESTADO_ATENCION_API: Record<EstadoAtencionUI, EstadoAtencion> = {
  Cualquiera: 'TODAS',
  Pendientes: 'PENDIENTES',
  Atendidas: 'ATENDIDAS',
};
// Distancia al final (px) desde la que se pide la siguiente página del historial o de las alertas
const DISTANCIA_CARGA_MAS = 600;

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
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const y = contentOffset.y;
    // Scroll infinito del historial y de las alertas: pide la página siguiente antes de llegar al final.
    // Si la última carga falló no se reintenta sola (se repetiría en cada evento de scroll)
    const lista = activeTab === 'HISTORIAL' ? historial : activeTab === 'ALERTAS' ? alertas : null;
    if (lista && !lista.errorMas && y + layoutMeasurement.height >= contentSize.height - DISTANCIA_CARGA_MAS) {
      lista.cargarMas();
    }
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
  const [maquinaAReemplazar, setMaquinaAReemplazar] = useState<MaquinaFlota | null>(null);
  const [isEditarModalVisible, setIsEditarModalVisible] = useState(false);
  const [maquinaAEditar, setMaquinaAEditar] = useState<MaquinaFlota | null>(null);
  const [maquinaAToggle, setMaquinaAToggle] = useState<MaquinaFlota | null>(null);
  const [maquinaADevolver, setMaquinaADevolver] = useState<MaquinaFlota | null>(null);

  // La búsqueda la resuelve el Backend; el filtro por estado se aplica sobre el resultado
  const { maquinas, contadorFlota, isLoading, error, guardadoEn, refetch, actualizarMaquina } = useFlotaResumen(searchQuery);

  const [filtroHistorial, setFiltroHistorial] = useState<FiltroHistorialUI>('Todo');
  const rangoHistorial = useRangoFechas();
  const historial = useHistorial(FILTRO_HISTORIAL_API[filtroHistorial], rangoHistorial.rango);

  const [filtroAlertas, setFiltroAlertas] = useState<FiltroAlertasUI>('Todas');
  const rangoAlertas = useRangoFechas();
  const [estadoAlertas, setEstadoAlertas] = useState<EstadoAtencionUI>('Cualquiera');
  const alertas = useAlertas(FILTRO_ALERTAS_API[filtroAlertas], ESTADO_ATENCION_API[estadoAlertas], rangoAlertas.rango);
  // Alerta que se está atendiendo (modal abierto); null = cerrado
  const [alertaAAtender, setAlertaAAtender] = useState<Alerta | null>(null);
  const conectado = useConectado();

  const confirmarDescarte = (idOperacion: number) =>
    Alert.alert('Descartar atención', 'El servidor no la aceptó. Si la descartas, se borra de este teléfono y no se envía.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => void descartarAtencionPendiente(idOperacion) },
    ]);

  // Deslizar hacia abajo recarga la pestaña visible (en Flota también el contador de alertas)
  const { refetch: refetchHistorial } = historial;
  const { refetch: refetchAlertas } = alertas;
  const recargarPestana = useCallback(() => {
    if (activeTab === 'HISTORIAL') refetchHistorial();
    else if (activeTab === 'ALERTAS') refetchAlertas();
    else {
      refetch();
      refetchAlertas();
    }
  }, [activeTab, refetchHistorial, refetchAlertas, refetch]);
  const cargandoPestana = activeTab === 'HISTORIAL' ? historial.isLoading : activeTab === 'ALERTAS' ? alertas.isLoading : isLoading;
  const recarga = useRecargaManual(recargarPestana, cargandoPestana);

  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  const handleLogout = async () => {
    await cerrarSesion();
    setIsLogoutModalVisible(false);
    router.replace('/');
  };

  const handleSustituir = (maquina: MaquinaFlota) => {
    setMaquinaAReemplazar(maquina);
  };

  const handleEditar = (maquina: MaquinaFlota) => {
    setMaquinaAEditar(maquina);
    setIsEditarModalVisible(true);
  };

  const handleToggleEstado = (maquina: MaquinaFlota) => {
    setMaquinaAToggle(maquina);
  };

  const filteredMaquinas = useMemo(
    () =>
      maquinas.filter(m => FILTRO_FLOTA[activeFilter](m)),
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
          {historial.isLoading && historial.items.length === 0
            ? 'Cargando...'
            : `${historial.items.length}${historial.hayMas ? '+' : ''} eventos`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'ALERTAS' && { backgroundColor: theme.card }]}
        onPress={() => {
          // Al entrar se recarga: un turno pudo pasar las 10 h mientras tanto
          if (activeTab !== 'ALERTAS') alertas.refetch();
          setActiveTab('ALERTAS');
        }}
        activeOpacity={0.7}
      >
        <View style={styles.tabIconRow}>
          <ShieldAlert size={16} color={activeTab === 'ALERTAS' ? theme.danger : theme.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'ALERTAS' ? theme.text : theme.textSecondary }]}>
            Alertas
          </Text>
        </View>
        <Text style={[styles.tabCounter, { color: activeTab === 'ALERTAS' ? theme.textSecondary : theme.textTertiary }]}>
          {alertas.activas === null ? (alertas.isLoading ? 'Cargando...' : 'Sin datos') : alertas.activas === 1 ? '1 activa' : `${alertas.activas} activas`}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderHistorial = () => (
    <GlassCapsule blurTarget={fondoRef}>
      {/* Qué se ve (segmentos) va separado de cuándo (chips de rango) */}
      <SegmentedControl opciones={FILTROS_HISTORIAL} activo={filtroHistorial} onChange={setFiltroHistorial} />
      <RangoFechasFiltro estado={rangoHistorial} />
      <AvisoDatosGuardados guardadoEn={historial.isLoading ? null : historial.guardadoEn} onReintentar={historial.refetch} />
      <ListaPorDia lista={historial} nombre="eventos" recargando={recarga.refreshing} renderItem={(evento) => <HistorialEventoCard evento={evento} />} />
    </GlassCapsule>
  );

  const renderAlertas = () => (
    <GlassCapsule blurTarget={fondoRef}>
      <SegmentedControl opciones={FILTROS_ALERTAS} activo={filtroAlertas} onChange={setFiltroAlertas} />
      <SegmentedControl opciones={ESTADOS_ATENCION} activo={estadoAlertas} onChange={setEstadoAlertas} />
      <RangoFechasFiltro estado={rangoAlertas} />
      <AvisoDatosGuardados guardadoEn={alertas.isLoading ? null : alertas.guardadoEn} onReintentar={alertas.refetch} />
      <ListaPorDia
        lista={alertas}
        nombre="alertas"
        recargando={recarga.refreshing}
        renderItem={(alerta) => <AlertaCard alerta={alerta} onAtender={setAlertaAAtender} onDescartarPendiente={confirmarDescarte} />}
      />
    </GlassCapsule>
  );

  const renderContent = () => {
    if (activeTab === 'HISTORIAL') return renderHistorial();
    if (activeTab === 'ALERTAS') return renderAlertas();

    return (
      <GlassCapsule blurTarget={fondoRef}>
        <FleetSearchBar value={searchQuery} onChangeText={setSearchQuery} />
        <FleetFilterChips activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        {/* Sin respuesta del Backend: la flota guardada en el teléfono, con su antigüedad */}
        <AvisoDatosGuardados guardadoEn={isLoading ? null : guardadoEn} onReintentar={refetch} />

        {/* Al deslizar para recargar se mantiene la lista: el indicador ya se ve arriba. Con la flota
            guardada en el teléfono se muestra esa mientras responde el Backend */}
        {isLoading && !guardadoEn && !(recarga.refreshing && maquinas.length > 0) ? (
          <ActivityIndicator size="large" color={theme.warning} style={{ marginTop: 40 }} />
        ) : error && !guardadoEn ? (
          <View style={{ alignItems: 'center', marginTop: 40, gap: 12 }}>
            <Text style={{ textAlign: 'center', color: theme.dangerText }}>{error.message}</Text>
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
              onCambiarEstado={handleToggleEstado}
              onDevolver={setMaquinaADevolver}
              conectado={conectado}
            />
          ))
        )}
      </GlassCapsule>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* Lo que el jefe de turno hizo sin señal también queda por sincronizar */}
      <LoginHeader showConnectionStatus showSyncStatus />

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
          refreshControl={
            <RefreshControl
              refreshing={recarga.refreshing}
              onRefresh={recarga.onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
              progressBackgroundColor={theme.card}
            />
          }
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
        maquina={maquinaAReemplazar}
        onClose={() => setMaquinaAReemplazar(null)}
        onReemplazado={() => {
          // Cambian dos máquinas (y quizá un operador): se recarga la flota completa
          refetch();
          historial.refetch();
        }}
      />

      <EditarEquipoModal
        visible={isEditarModalVisible}
        onClose={() => {
          setIsEditarModalVisible(false);
          setMaquinaAEditar(null);
        }}
        maquina={maquinaAEditar}
        onSave={(maquinaActualizada) => {
          actualizarMaquina(maquinaActualizada);
          // Si se reasignó un operador, otra máquina pudo quedar sin él: se recarga la flota completa
          refetch();
          // La edición queda en la bitácora: aparece en el historial
          historial.refetch();
        }}
      />

      <ConfirmLogoutModal
        visible={isLogoutModalVisible}
        onCancel={() => setIsLogoutModalVisible(false)}
        onConfirm={handleLogout}
      />
      {/* Superpuestos: deben ser los últimos hijos de la raíz de la pantalla (solo uno se abre a la vez) */}
      <DevolverEquipoModal
        maquina={maquinaADevolver}
        onClose={() => setMaquinaADevolver(null)}
        onDevuelto={() => {
          // Cambian dos máquinas y un operador: se recarga la flota completa
          refetch();
          historial.refetch();
        }}
      />
      <AtenderAlertaModal
        alerta={alertaAAtender}
        onClose={() => setAlertaAAtender(null)}
        // Se actualiza la tarjeta aunque ya no calce con el filtro, para que no desaparezca mientras se mira
        onAtendida={(idAlerta, atenciones) => alertas.actualizar(idAlerta, (a) => ({ ...a, atenciones }))}
      />
      <CambiarEstadoModal
        maquina={maquinaAToggle}
        onClose={() => setMaquinaAToggle(null)}
        onCambiado={(maquinaActualizada) => {
          actualizarMaquina(maquinaActualizada);
          // El cambio queda en la bitácora: aparece en el historial
          historial.refetch();
        }}
      />
    </SafeAreaView>
  );
};

