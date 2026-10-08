import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme, TextInput, ActivityIndicator } from 'react-native';
import { AppBottomSheetModal } from '../common/AppBottomSheetModal';
import { SearchableSelect } from '../common/SearchableSelect';
import { AlertCircle, AlertTriangle, CheckCircle, ClipboardList, Gauge, ListChecks, PlusCircle, RefreshCw, Truck, User } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { MOTIVOS_REEMPLAZO } from '../../constants/motivosJefeTurno';
import { EQUIPO_FORM_INICIAL, EquipoDataForm, EquipoFormState } from './EquipoDataForm';
import { OperadorSelect } from './OperadorSelect';
import { SegmentedControl } from './SegmentedControl';
import { useModelosMaquina } from '../../hooks/useModelosMaquina';
import { useOpcionesMaquina } from '../../hooks/useOpcionesMaquina';
import { useOperadoresAsignables } from '../../hooks/useOperadoresAsignables';
import { MaquinaFlota, mapMaquinaFlota } from '../../hooks/useFlotaResumen';
import { listarFlota, reemplazarMaquina } from '../../services/flotaService';
import { styles } from './ReemplazoEquipoModal.styles';

interface Props {
  // Máquina que sale (la de la tarjeta); null = modal cerrado
  maquina: MaquinaFlota | null;
  onClose: () => void;
  // El Backend registró el reemplazo: hay que refrescar la flota y el historial
  onReemplazado: () => void;
}

type Origen = 'De la flota' | 'Nueva';
const ORIGENES = [
  { valor: 'De la flota', icono: ListChecks },
  { valor: 'Nueva', icono: PlusCircle },
] as const satisfies readonly { valor: Origen; icono: unknown }[];

// Accesores estables para SearchableSelect (evitan recalcular la búsqueda en cada render)
const comoTexto = (valor: string) => valor;
const idDe = (m: MaquinaFlota) => m.id;
const codigoDe = (m: MaquinaFlota) => m.codigo;
const descripcionDe = (m: MaquinaFlota) =>
  [m.estadoOperativo === 'FUERA_DE_SERVICIO' ? 'Fuera de servicio (respaldo)' : 'Operativa', m.marcaModelo, m.operadorAsignado]
    .filter(Boolean)
    .join(' · ');

const equipoValido = (eq: EquipoFormState) => {
  const horometro = Number(eq.horometro);
  return (
    eq.codigo.trim() !== '' &&
    eq.patente.trim() !== '' &&
    eq.marca.trim() !== '' &&
    eq.modelo.trim() !== '' &&
    eq.tipoMaquina.trim() !== '' &&
    eq.horometro.trim() !== '' &&
    Number.isFinite(horometro) &&
    horometro >= 0 &&
    (eq.anio === '' || eq.anio.length === 4)
  );
};

export const ReemplazoEquipoModal: React.FC<Props> = ({ maquina, onClose, onReemplazado }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const visible = maquina !== null;
  const modelos = useModelosMaquina(visible);
  const opcionesMaquina = useOpcionesMaquina(visible);
  const operadores = useOperadoresAsignables(visible);
  const successColor = colorScheme === 'dark' ? '#81c995' : theme.success;

  const [origen, setOrigen] = useState<Origen>('De la flota');
  const [entrante, setEntrante] = useState<MaquinaFlota | null>(null);
  const [nueva, setNueva] = useState<EquipoFormState>(EQUIPO_FORM_INICIAL);
  const [operadorId, setOperadorId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  // Candidatas a entrar: toda la flota (no solo lo filtrado en la pantalla), salvo la saliente
  const [flota, setFlota] = useState<MaquinaFlota[]>([]);
  const [cargandoFlota, setCargandoFlota] = useState(false);
  const [errorFlota, setErrorFlota] = useState<string | null>(null);
  const [intentoFlota, setIntentoFlota] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let cancelado = false;
    const timer = setTimeout(async () => {
      setCargandoFlota(true);
      setErrorFlota(null);
      try {
        const lista = (await listarFlota('')).map(mapMaquinaFlota);
        // Primero las de respaldo (fuera de servicio), que son las que normalmente entran
        lista.sort((a, b) => Number(a.estadoOperativo === 'OPERATIVO') - Number(b.estadoOperativo === 'OPERATIVO'));
        if (!cancelado) setFlota(lista);
      } catch (err) {
        if (!cancelado) setErrorFlota(err instanceof Error ? err.message : 'No se pudo cargar la flota.');
      } finally {
        if (!cancelado) setCargandoFlota(false);
      }
    }, 0);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [visible, intentoFlota]);

  // Cada apertura parte en blanco; el operador de la saliente pasa por defecto a la entrante
  const [abiertoPara, setAbiertoPara] = useState<MaquinaFlota | null>(null);
  if (maquina !== abiertoPara) {
    setAbiertoPara(maquina);
    setOrigen('De la flota');
    setEntrante(null);
    setNueva(EQUIPO_FORM_INICIAL);
    setOperadorId(maquina?.idOperadorAsignado === null || !maquina ? '' : String(maquina.idOperadorAsignado));
    setMotivo('');
    setObservaciones('');
    setErrorEnvio(null);
  }

  if (!maquina) return null;

  const candidatas = flota.filter((m) => m.id !== maquina.id);
  const entranteLista = origen === 'De la flota' ? entrante !== null : equipoValido(nueva);
  const isFormValid = entranteLista && motivo !== '' && !guardando;

  const cerrar = () => {
    if (!guardando) onClose();
  };

  const handleSubmit = async () => {
    setGuardando(true);
    setErrorEnvio(null);
    try {
      await reemplazarMaquina(maquina.id, {
        ...(origen === 'De la flota'
          ? { idMaquinaEntrante: entrante!.id }
          : {
              maquinaNueva: {
                nombre: nueva.codigo.trim(),
                marca: nueva.marca.trim(),
                modelo: nueva.modelo.trim(),
                tipoMaquina: nueva.tipoMaquina.trim(),
                anio: nueva.anio ? Number(nueva.anio) : null,
                patente: nueva.patente.trim() || null,
                numeroChasis: nueva.chasis.trim() || null,
                horometroInicial: Number(nueva.horometro),
                esContratista: nueva.contratista,
              },
            }),
        idOperador: operadorId ? Number(operadorId) : null,
        motivo,
        observacion: observaciones.trim() || null,
      });
      onReemplazado();
      onClose();
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : 'No se pudo registrar el reemplazo.');
    } finally {
      setGuardando(false);
    }
  };

  const headerTop = (
    <View style={styles.headerTopBadge}>
      <Text style={[styles.headerTopText, { color: theme.primary }]}>JEFE DE TURNO</Text>
    </View>
  );

  const renderFooter = () => (
    <>
      <TouchableOpacity style={[styles.btnSecundario, { backgroundColor: theme.cardAlt }]} onPress={cerrar} disabled={guardando}>
        <Text style={[styles.btnSecundarioText, { color: theme.text }]}>Cancelar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btnPrimario, { backgroundColor: theme.warning, opacity: isFormValid ? 1 : 0.5 }]}
        onPress={handleSubmit}
        disabled={!isFormValid}
      >
        {guardando ? <ActivityIndicator color="#FFF" /> : <CheckCircle size={18} color="#FFF" />}
        <Text style={styles.btnPrimarioText}>{guardando ? 'Reemplazando...' : 'Confirmar Reemplazo'}</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <AppBottomSheetModal
      visible={visible}
      onClose={cerrar}
      title="Reemplazo de Equipo"
      subtitle={`${maquina.codigo} sale de servicio y otro equipo toma su lugar`}
      icon={<RefreshCw size={22} color={theme.warning} />}
      iconBadgeColor={theme.warning + '15'}
      headerTop={headerTop}
      footer={renderFooter()}
      modalStyle={{ width: '95%', maxWidth: 700, maxHeight: '92%' }}
    >
      {/* 1. Saliente: la máquina de la tarjeta */}
      <View style={[styles.section, styles.capsuleSection, { backgroundColor: theme.danger + '08', borderColor: theme.danger + '60', borderWidth: 1.5 }]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <AlertCircle size={18} color={theme.danger} />
            <Text style={[styles.sectionTitle, { color: theme.danger, marginBottom: 0 }]}>1. EQUIPO SALIENTE (QUEDA FUERA DE SERVICIO)</Text>
          </View>
        </View>
        <Text style={[styles.salienteCodigo, { color: theme.text }]}>{maquina.codigo}</Text>
        <Text style={[styles.salienteDetalle, { color: theme.textSecondary }]}>{maquina.marcaModelo}</Text>
        <View style={styles.salienteFila}>
          <View style={styles.salienteDato}>
            <Gauge size={14} color={theme.textSecondary} />
            <Text style={[styles.salienteDetalle, { color: theme.textSecondary }]}>
              {maquina.horometroActual.toLocaleString('es-CL', { minimumFractionDigits: 1 })} hrs
            </Text>
          </View>
          <View style={styles.salienteDato}>
            <User size={14} color={theme.textSecondary} />
            <Text style={[styles.salienteDetalle, { color: theme.textSecondary }]}>{maquina.operadorAsignado ?? 'Sin operador asignado'}</Text>
          </View>
        </View>
      </View>

      {/* 2. Entrante: de la flota o nueva */}
      <View style={[styles.section, styles.capsuleSection, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Truck size={16} color={successColor} />
            <Text style={[styles.sectionTitle, { color: successColor, marginBottom: 0 }]}>2. EQUIPO ENTRANTE</Text>
          </View>
        </View>
        <SegmentedControl opciones={ORIGENES} activo={origen} onChange={setOrigen} />

        {origen === 'De la flota' ? (
          <View style={styles.fieldFull}>
            <SearchableSelect
              label="MÁQUINA QUE ENTRA *"
              placeholder="Buscar por código..."
              options={candidatas}
              value={entrante}
              onChange={setEntrante}
              getOptionKey={idDe}
              getOptionLabel={codigoDe}
              getOptionDescription={descripcionDe}
              isLoading={cargandoFlota}
              error={errorFlota}
              onRetry={() => setIntentoFlota((n) => n + 1)}
              emptyMessage="No hay otras máquinas en la flota"
              hint={
                entrante?.estadoOperativo === 'FUERA_DE_SERVICIO'
                  ? 'Está fuera de servicio: quedará operativa al confirmar.'
                  : 'Las de respaldo (fuera de servicio) aparecen primero.'
              }
            />
          </View>
        ) : (
          <EquipoDataForm
            equipoIdx={0}
            state={nueva}
            onChange={setNueva}
            plantillas={modelos.plantillas}
            cargandoPlantillas={modelos.cargando}
            errorPlantillas={modelos.error}
            opciones={opcionesMaquina}
          />
        )}

        <View style={styles.fieldFull}>
          <OperadorSelect
            operadores={operadores}
            valor={operadorId}
            onChange={setOperadorId}
            idMaquina={origen === 'De la flota' ? entrante?.id : undefined}
            label="OPERADOR DEL EQUIPO ENTRANTE"
          />
        </View>
      </View>

      {/* 3. Justificación */}
      <View style={[styles.section, styles.capsuleSection, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <ClipboardList size={16} color={theme.warning} />
            <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginBottom: 0 }]}>3. JUSTIFICACIÓN DEL JEFE DE TURNO</Text>
          </View>
        </View>

        <View style={styles.fieldFull}>
          <SearchableSelect
            label="MOTIVO *"
            placeholder="Buscar o seleccionar motivo..."
            options={MOTIVOS_REEMPLAZO}
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
            placeholder="Ej. Falla en la transmisión; el equipo va a taller."
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
