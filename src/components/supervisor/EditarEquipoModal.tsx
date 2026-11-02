import React, { useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme, TextInput, ActivityIndicator } from 'react-native';
import { AppBottomSheetModal } from '../common/AppBottomSheetModal';
import { Edit2, CheckCircle, ChevronDown, Activity, Truck, ClipboardList, AlertTriangle } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { MaquinaFlota, mapMaquinaFlota } from '../../hooks/useFlotaResumen';
import { conRegreso, ESTADOS_MAQUINA, EstadoMaquina, operaEnEstado, presentacionEstado } from '../../constants/estadosMaquina';
import { useOpcionesMaquina } from '../../hooks/useOpcionesMaquina';
import { useOperadoresAsignables } from '../../hooks/useOperadoresAsignables';
import { type FichaMaquinaApi } from '../../services/flotaService';
import { type AccionPreparada, cerrarTurnoJefe, DETALLE_SIN_SENAL, editarMaquinaJefe, nuevaAccion } from '../../services/accionesJefe';
import { CierreTurnoCampos, leerHorometro } from './CierreTurnoCampos';
import { RegresoEstimadoChips, regresoDesdeAhora } from './RegresoEstimadoChips';
import { EQUIPO_FORM_INICIAL, EquipoDataForm, EquipoFormState } from './EquipoDataForm';
import { SearchableSelect } from '../common/SearchableSelect';
import { MOTIVOS_EDICION } from '../../constants/motivosJefeTurno';
import { styles } from './EditarEquipoModal.styles';
import { useAccionUnica } from '../../hooks/useAccionUnica';
import { mostrarAviso } from '../../services/retroalimentacion';
import { useVersionBase } from '../../hooks/useVersionBase';

interface Props {
  visible: boolean;
  onClose: () => void;
  maquina: MaquinaFlota | null;
  // Recibe la máquina tal como quedó en el Backend (sin señal el cambio queda en la cola y la flota lo muestra pendiente)
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
const huella = (eq: EquipoFormState, estado: EstadoMaquina) =>
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

// La ficha como la recibe el Backend
const aFicha = (eq: EquipoFormState): FichaMaquinaApi => ({
  nombre: eq.codigo.trim(),
  marca: eq.marca.trim(),
  modelo: eq.modelo.trim(),
  tipoMaquina: eq.tipoMaquina.trim(),
  anio: eq.anio ? Number(eq.anio) : null,
  patente: eq.patente.trim() || null,
  numeroChasis: eq.chasis.trim() || null,
  esContratista: eq.contratista,
  idOperador: eq.operadorId ? Number(eq.operadorId) : null,
});

const comparable = (valor: unknown) => (typeof valor === 'string' ? valor.toUpperCase() : valor);

/**
 * Solo los campos que el jefe de turno cambió, y lo que veía en cada uno (valoresBase): si otro jefe cambió la
 * máquina mientras tanto, el Backend aplica igual los campos que el otro no tocó
 */
const camposCambiados = (antes: FichaMaquinaApi, despues: FichaMaquinaApi) => {
  const campos = (Object.keys(despues) as (keyof FichaMaquinaApi)[]).filter((c) => comparable(despues[c]) !== comparable(antes[c]));
  return {
    cambios: Object.fromEntries(campos.map((c) => [c, despues[c]])) as Partial<FichaMaquinaApi>,
    valoresBase: Object.fromEntries(campos.map((c) => [c, antes[c]])) as Partial<FichaMaquinaApi>,
  };
};

// Accesor estable para SearchableSelect (evita recalcular la búsqueda en cada render)
const comoTexto = (valor: string) => valor;

export const EditarEquipoModal: React.FC<Props> = ({ visible, onClose, maquina, onSave }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const opcionesMaquina = useOpcionesMaquina(visible);
  const operadores = useOperadoresAsignables(visible);

  const [equipo, setEquipo] = useState<EquipoFormState>(EQUIPO_FORM_INICIAL);
  const [estadoOperativo, setEstadoOperativo] = useState<EstadoMaquina>('ACTIVA');
  const [motivo, setMotivo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [estadoAbierto, setEstadoAbierto] = useState(false);
  const [horasRegreso, setHorasRegreso] = useState<number | null>(null);
  const [horometroCierre, setHorometroCierre] = useState('');
  // Si la edición falla después de cerrar el turno, al reintentar no se vuelve a cerrar
  const [turnoCerrado, setTurnoCerrado] = useState(false);
  // Bloquea toques repetidos en el botón de confirmar mientras se guarda
  const [guardando, ejecutarUnaVez] = useAccionUnica();
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const { versionBase, explicarError } = useVersionBase(maquina);
  // El mismo UUID en cada reintento de esta apertura: el Backend no aplica el cambio dos veces
  const [accion, setAccion] = useState<AccionPreparada | null>(null);

  // Al abrir (o cambiar de máquina) el formulario parte desde los datos guardados
  const [cargadaDe, setCargadaDe] = useState<MaquinaFlota | null>(null);
  if (visible && maquina && maquina !== cargadaDe) {
    setCargadaDe(maquina);
    setEquipo(aFormulario(maquina));
    setEstadoOperativo(maquina.estado);
    setMotivo('');
    setObservaciones('');
    setEstadoAbierto(false);
    setHorasRegreso(null);
    setHorometroCierre('');
    setTurnoCerrado(false);
    setErrorEnvio(null);
    setAccion(null);
  }
  if (!visible && cargadaDe) setCargadaDe(null);

  if (!maquina) return null;

  const hayCambios = huella(equipo, estadoOperativo) !== huella(aFormulario(maquina), maquina.estado);
  const anioValido = equipo.anio === '' || equipo.anio.length === 4;
  // Si cambia el estado, el motivo explica el cambio de estado (queda también en la tarjeta mientras dure)
  const motivosPara = (estado: EstadoMaquina) => (estado === maquina.estado ? MOTIVOS_EDICION : presentacionEstado(estado).motivos);
  const motivos = motivosPara(estadoOperativo);

  const cambiaEstado = estadoOperativo !== maquina.estado;
  // Sacarla de operación con un operador trabajando: primero se cierra su turno con el horómetro final
  const pideCierre = cambiaEstado && !operaEnEstado(estadoOperativo) && !!maquina.operadorEnTurno && !turnoCerrado;
  const horometro = leerHorometro(horometroCierre);
  const cierreListo = !pideCierre || (horometro !== null && horometro >= maquina.horometroActual);

  const isValid =
    hayCambios &&
    cierreListo &&
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

  const handleSave = () => ejecutarUnaVez(async () => {
    setErrorEnvio(null);
    // El mismo UUID en cada reintento (cierre y cambio): el Backend no los aplica dos veces
    const preparada = accion ?? nuevaAccion();
    setAccion(preparada);
    let cerroTurno = false;
    try {
      if (pideCierre && horometro !== null) {
        // Sin señal queda en la cola antes del cambio, que lo espera
        const cierre = await cerrarTurnoJefe(maquina, horometro, motivo, preparada);
        cerroTurno = true;
        setTurnoCerrado(true);
        // Otro lo cerró antes (gana el primer cierre): se avisa quién y cuándo, y el cambio sigue
        if (cierre.estado === 'ya-cerrado') mostrarAviso(cierre.mensaje, { tipo: 'info' });
      }
      const { cambios, valoresBase } = camposCambiados(aFicha(aFormulario(maquina)), aFicha(equipo));
      const regreso =
        cambiaEstado && conRegreso(estadoOperativo) && horasRegreso !== null ? regresoDesdeAhora(horasRegreso).toISOString() : undefined;
      // El operador elegido estaba en otra máquina: si otro jefe lo movió mientras tanto, el Backend lo informa
      const operador = cambios.idOperador ? operadores.operadores.find((o) => o.idOperador === cambios.idOperador) : undefined;
      const obs = observaciones.trim() || null;
      const resultado = await editarMaquinaJefe(
        maquina,
        {
          ...cambios,
          ...(cambiaEstado ? { estado: estadoOperativo } : {}),
          ...(regreso ? { regresoEstimado: regreso } : {}),
          motivo,
          observacion: obs,
          versionBase,
          valoresBase: { ...valoresBase, ...(operador ? { maquinaOperador: operador.maquinaAsignada?.idMaquina ?? null } : {}) },
        },
        {
          ...(cambios.nombre !== undefined ? { codigo: cambios.nombre.toUpperCase() } : {}),
          ...(cambios.patente !== undefined ? { patente: (cambios.patente ?? '').toUpperCase() } : {}),
          ...(cambios.marca !== undefined ? { marca: cambios.marca } : {}),
          ...(cambios.modelo !== undefined ? { modelo: cambios.modelo } : {}),
          ...(cambios.tipoMaquina !== undefined ? { tipoMaquina: cambios.tipoMaquina } : {}),
          ...(cambios.anio !== undefined ? { anio: cambios.anio } : {}),
          ...(cambios.numeroChasis !== undefined ? { numeroChasis: cambios.numeroChasis } : {}),
          ...(cambios.esContratista !== undefined ? { esContratista: cambios.esContratista } : {}),
          ...(cambios.idOperador !== undefined ? { idOperadorAsignado: cambios.idOperador, operadorAsignado: operador?.nombre ?? null } : {}),
          ...(cambiaEstado
            ? {
                estado: estadoOperativo,
                motivoEstado: [motivo, obs].filter(Boolean).join(': '),
                regresoEstimado: conRegreso(estadoOperativo) ? (regreso ?? maquina.regresoEstimado) : null,
              }
            : {}),
        },
        preparada,
      );
      if (resultado.enviada) onSave?.(mapMaquinaFlota(resultado.respuesta));
      onClose();
      mostrarAviso('Cambios guardados', resultado.enviada ? {} : { detalle: DETALLE_SIN_SENAL, tipo: 'info' });
    } catch (err) {
      const mensaje = await explicarError(err, 'No se pudieron guardar los cambios.');
      setErrorEnvio(cerroTurno ? `El turno de ${maquina.operadorEnTurno} quedó cerrado, pero: ${mensaje}` : mensaje);
    }
  });

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

  const opcionEstado = (estado: EstadoMaquina, conBorde: boolean) => (
    <TouchableOpacity
      key={estado}
      style={[styles.dropdownOption, conBorde && styles.dropdownOptionBorder, { borderBottomColor: theme.border }]}
      onPress={() => {
        setEstadoOperativo(estado);
        // Un motivo de la otra lista ya no corresponde
        if (!motivosPara(estado).includes(motivo)) setMotivo('');
        setEstadoAbierto(false);
      }}
    >
      <Activity size={16} color={presentacionEstado(estado).color(theme)} />
      <Text style={[styles.dropdownOptionText, { color: estadoOperativo === estado ? theme.primary : theme.text }]}>
        {presentacionEstado(estado).etiqueta}
      </Text>
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
              <Activity size={16} color={presentacionEstado(estadoOperativo).color(theme)} />
              <Text style={[styles.dropdownText, { color: theme.text }]} numberOfLines={1}>
                {presentacionEstado(estadoOperativo).etiqueta}
              </Text>
            </View>
            <ChevronDown size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          {estadoAbierto && (
            <View style={[styles.dropdownOptionsContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
              {ESTADOS_MAQUINA.map((e, i) => opcionEstado(e.valor, i < ESTADOS_MAQUINA.length - 1))}
            </View>
          )}
        </View>
        {cambiaEstado && conRegreso(estadoOperativo) && (
          <RegresoEstimadoChips horas={horasRegreso} onChange={setHorasRegreso} codigo={maquina.codigo} disabled={guardando} />
        )}
        {pideCierre && (
          <CierreTurnoCampos maquina={maquina} horometro={horometroCierre} onChange={setHorometroCierre} disabled={guardando} />
        )}
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
          <Text style={[styles.errorText, { color: theme.dangerText }]}>{errorEnvio}</Text>
        </View>
      )}
    </AppBottomSheetModal>
  );
};
