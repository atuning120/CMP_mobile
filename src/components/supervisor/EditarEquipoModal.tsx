import React, { useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme, TextInput, ActivityIndicator } from 'react-native';
import { AppBottomSheetModal } from '../common/AppBottomSheetModal';
import { Edit2, CheckCircle, ChevronDown, Activity, Truck, ClipboardList, AlertTriangle } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { MaquinaFlota, EstadoOperativo, mapMaquinaFlota } from '../../hooks/useFlotaResumen';
import { useOpcionesMaquina } from '../../hooks/useOpcionesMaquina';
import { useOperadoresAsignables } from '../../hooks/useOperadoresAsignables';
import { editarMaquina } from '../../services/flotaService';
import { EQUIPO_FORM_INICIAL, EquipoDataForm, EquipoFormState } from './EquipoDataForm';
import { SearchableSelect } from '../common/SearchableSelect';
import { MOTIVOS_DESHABILITAR, MOTIVOS_EDICION, MOTIVOS_HABILITAR } from '../../constants/motivosJefeTurno';
import { styles } from './EditarEquipoModal.styles';

interface Props {
  visible: boolean;
  onClose: () => void;
  maquina: MaquinaFlota | null;
  // Recibe la máquina tal como quedó en el Backend
  onSave?: (maquinaActualizada: MaquinaFlota) => void;
}

const aFormulario = (maquina: MaquinaFlota): EquipoFormState => ({
  ...EQUIPO_FORM_INICIAL,
  codigo: maquina.codigo,
  patente: maquina.patente,
  marca: maquina.marca,
  modelo: maquina.modelo,
  tipoMaquina: maquina.tipoMaquina,
  anio: maquina.anio === null ? '' : String(maquina.anio),
  horometro: String(maquina.horometroActual),
  chasis: maquina.numeroChasis ?? '',
  contratista: maquina.esContratista,
  operadorId: maquina.idOperadorAsignado === null ? '' : String(maquina.idOperadorAsignado),
});

// Lo que se compara para saber si hay cambios (sin espacios extra ni diferencias de mayúsculas en código y patente)
const huella = (eq: EquipoFormState, estado: EstadoOperativo) =>
  JSON.stringify([
    eq.codigo.trim().toUpperCase(),
    eq.patente.trim().toUpperCase(),
    eq.marca.trim(),
    eq.modelo.trim(),
    eq.tipoMaquina.trim(),
    eq.anio,
    eq.chasis.trim(),
    eq.contratista,
    eq.operadorId,
    estado,
  ]);

// Accesor estable para SearchableSelect (evita recalcular la búsqueda en cada render)
const comoTexto = (valor: string) => valor;

export const EditarEquipoModal: React.FC<Props> = ({ visible, onClose, maquina, onSave }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const opcionesMaquina = useOpcionesMaquina(visible);
  const operadores = useOperadoresAsignables(visible);

  const [equipo, setEquipo] = useState<EquipoFormState>(EQUIPO_FORM_INICIAL);
  const [estadoOperativo, setEstadoOperativo] = useState<EstadoOperativo>('OPERATIVO');
  const [motivo, setMotivo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [estadoAbierto, setEstadoAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  // Al abrir (o cambiar de máquina) el formulario parte desde los datos guardados
  const [cargadaDe, setCargadaDe] = useState<MaquinaFlota | null>(null);
  if (visible && maquina && maquina !== cargadaDe) {
    setCargadaDe(maquina);
    setEquipo(aFormulario(maquina));
    setEstadoOperativo(maquina.estadoOperativo);
    setMotivo('');
    setObservaciones('');
    setEstadoAbierto(false);
    setErrorEnvio(null);
  }
  if (!visible && cargadaDe) setCargadaDe(null);

  if (!maquina) return null;

  const hayCambios = huella(equipo, estadoOperativo) !== huella(aFormulario(maquina), maquina.estadoOperativo);
  const anioValido = equipo.anio === '' || equipo.anio.length === 4;
  // Si cambia el estado, el motivo explica el cambio de estado (queda también en la tarjeta si se deshabilita)
  const motivosPara = (estado: EstadoOperativo) =>
    estado === maquina.estadoOperativo ? MOTIVOS_EDICION : estado === 'FUERA_DE_SERVICIO' ? MOTIVOS_DESHABILITAR : MOTIVOS_HABILITAR;
  const motivos = motivosPara(estadoOperativo);

  const isValid =
    hayCambios &&
    anioValido &&
    motivo !== '' &&
    equipo.codigo.trim() !== '' &&
    equipo.patente.trim() !== '' &&
    equipo.marca.trim() !== '' &&
    equipo.modelo.trim() !== '' &&
    equipo.tipoMaquina.trim() !== '';

  const cerrar = () => {
    if (guardando) return;
    onClose();
  };

  const handleSave = async () => {
    setGuardando(true);
    setErrorEnvio(null);
    try {
      const actualizada = await editarMaquina(maquina.id, {
        nombre: equipo.codigo.trim(),
        marca: equipo.marca.trim(),
        modelo: equipo.modelo.trim(),
        tipoMaquina: equipo.tipoMaquina.trim(),
        anio: equipo.anio ? Number(equipo.anio) : null,
        patente: equipo.patente.trim() || null,
        numeroChasis: equipo.chasis.trim() || null,
        esContratista: equipo.contratista,
        idOperador: equipo.operadorId ? Number(equipo.operadorId) : null,
        estado: estadoOperativo === 'OPERATIVO' ? 'ACTIVA' : 'BAJA',
        motivo,
        observacion: observaciones.trim() || null,
      });
      onSave?.(mapMaquinaFlota(actualizada));
      onClose();
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : 'No se pudieron guardar los cambios.');
    } finally {
      setGuardando(false);
    }
  };

  const renderFooter = () => (
    <>
      <TouchableOpacity style={[styles.btnSecundario, { backgroundColor: theme.cardAlt }]} onPress={cerrar} disabled={guardando}>
        <Text style={[styles.btnSecundarioText, { color: theme.text }]}>Cancelar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btnPrimario, { backgroundColor: theme.primary, opacity: isValid && !guardando ? 1 : 0.5 }]}
        onPress={handleSave}
        disabled={!isValid || guardando}
      >
        {guardando ? <ActivityIndicator color="#FFF" /> : <CheckCircle size={18} color="#FFF" />}
        <Text style={styles.btnPrimarioText}>{guardando ? 'Guardando...' : 'Guardar Cambios'}</Text>
      </TouchableOpacity>
    </>
  );

  const etiquetaEstado = (estado: EstadoOperativo) => (estado === 'OPERATIVO' ? 'Operativo (En Servicio)' : 'Fuera de Servicio (Detenido)');
  const opcionEstado = (estado: EstadoOperativo, conBorde: boolean) => (
    <TouchableOpacity
      style={[styles.dropdownOption, conBorde && styles.dropdownOptionBorder, { borderBottomColor: theme.border }]}
      onPress={() => {
        setEstadoOperativo(estado);
        // Un motivo de la otra lista ya no corresponde
        if (!motivosPara(estado).includes(motivo)) setMotivo('');
        setEstadoAbierto(false);
      }}
    >
      <Activity size={16} color={estado === 'OPERATIVO' ? theme.success : theme.danger} />
      <Text style={[styles.dropdownOptionText, { color: estadoOperativo === estado ? theme.primary : theme.text }]}>{etiquetaEstado(estado)}</Text>
    </TouchableOpacity>
  );

  return (
    <AppBottomSheetModal
      visible={visible}
      onClose={cerrar}
      title="Editar Ficha de Equipo Móvil"
      icon={<Edit2 size={22} color={theme.primary} />}
      iconBadgeColor={theme.primary + '15'}
      headerRight={
        <View style={{ backgroundColor: theme.cardAlt, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
          <Text style={{ color: theme.textSecondary, fontWeight: 'bold', fontSize: 12 }}>{maquina.codigo}</Text>
        </View>
      }
      footer={renderFooter()}
      modalStyle={{ width: '95%', maxWidth: 700, maxHeight: '92%' }}
    >
      <View style={[styles.section, styles.capsuleSection, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
        <View style={styles.sectionTitleRow}>
          <Activity size={16} color={theme.primary} />
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>1. ESTADO OPERACIONAL</Text>
        </View>
        <View style={[styles.fieldFull, { zIndex: 10 }]}>
          <TouchableOpacity
            style={[styles.dropdownSelector, { backgroundColor: theme.background, borderColor: estadoAbierto ? theme.primary : theme.border }]}
            onPress={() => setEstadoAbierto(!estadoAbierto)}
          >
            <View style={styles.dropdownSelectorInner}>
              <Activity size={16} color={estadoOperativo === 'OPERATIVO' ? theme.success : theme.danger} />
              <Text style={[styles.dropdownText, { color: theme.text }]} numberOfLines={1}>
                {etiquetaEstado(estadoOperativo)}
              </Text>
            </View>
            <ChevronDown size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          {estadoAbierto && (
            <View style={[styles.dropdownOptionsContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
              {opcionEstado('OPERATIVO', true)}
              {opcionEstado('FUERA_DE_SERVICIO', false)}
            </View>
          )}
        </View>
      </View>

      <View style={[styles.section, styles.capsuleSection, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
        <View style={styles.sectionTitleRow}>
          <Truck size={16} color={theme.primary} />
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>2. DATOS DE LA MÁQUINA</Text>
        </View>
        {/* El formulario decide al montarse si la marca y el tipo son nuevos: espera a tener las opciones */}
        {opcionesMaquina.cargando && opcionesMaquina.marcas.length === 0 ? (
          <ActivityIndicator color={theme.primary} style={{ marginVertical: 24 }} />
        ) : (
          <EquipoDataForm
            key={maquina.id}
            equipoIdx={0}
            state={equipo}
            onChange={setEquipo}
            plantillas={[]}
            opciones={opcionesMaquina}
            modo="editar"
            operadores={operadores}
            idMaquina={maquina.id}
          />
        )}
      </View>

      <View style={[styles.section, styles.capsuleSection, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
        <View style={styles.sectionTitleRow}>
          <ClipboardList size={16} color={theme.warning} />
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>3. JUSTIFICACIÓN DEL JEFE DE TURNO</Text>
        </View>

        <View style={styles.fieldFull}>
          <SearchableSelect
            label="MOTIVO *"
            placeholder="Buscar o seleccionar motivo..."
            options={motivos}
            value={motivo || null}
            onChange={(opcion) => setMotivo(opcion ?? '')}
            getOptionKey={comoTexto}
            getOptionLabel={comoTexto}
          />
        </View>

        <View style={styles.fieldFull}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>OBSERVACIONES</Text>
          <TextInput
            style={[styles.textarea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            value={observaciones}
            onChangeText={setObservaciones}
            placeholder="Ej. La patente se había registrado con un error de tipeo."
            placeholderTextColor={theme.textTertiary}
            multiline
            numberOfLines={3}
            maxLength={500}
            textAlignVertical="top"
          />
        </View>
      </View>

      {!!errorEnvio && (
        <View style={[styles.errorBox, { backgroundColor: theme.danger + '15', borderColor: theme.danger }]}>
          <AlertTriangle size={16} color={theme.danger} />
          <Text style={[styles.errorText, { color: theme.danger }]}>{errorEnvio}</Text>
        </View>
      )}
    </AppBottomSheetModal>
  );
};
