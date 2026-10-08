import React, { useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme, TextInput, ActivityIndicator } from 'react-native';
import { AppBottomSheetModal } from '../common/AppBottomSheetModal';
import { PlusCircle, CheckCircle, Truck, ClipboardList, AlertTriangle } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { EQUIPO_FORM_INICIAL, EquipoDataForm, EquipoFormState } from './EquipoDataForm';
import { useModelosMaquina } from '../../hooks/useModelosMaquina';
import { useOpcionesMaquina } from '../../hooks/useOpcionesMaquina';
import { useOperadoresAsignables } from '../../hooks/useOperadoresAsignables';
import { styles } from './IncorporacionEquipoModal.styles';
import { crearMaquina } from '../../services/flotaService';
import { SearchableSelect } from '../common/SearchableSelect';
import { MOTIVOS_INCORPORACION } from '../../constants/motivosJefeTurno';

interface Props {
  visible: boolean;
  onClose: () => void;
  // Se llama cada vez que el Backend registra una máquina, para refrescar la flota
  onCreated?: () => void;
}

const aCrearMaquina = (eq: EquipoFormState) => ({
  nombre: eq.codigo.trim(),
  marca: eq.marca.trim(),
  modelo: eq.modelo.trim(),
  tipoMaquina: eq.tipoMaquina.trim(),
  anio: eq.anio ? Number(eq.anio) : null,
  patente: eq.patente.trim() || null,
  numeroChasis: eq.chasis.trim() || null,
  horometroInicial: Number(eq.horometro),
  esContratista: eq.contratista,
  idOperador: eq.operadorId ? Number(eq.operadorId) : null,
});

// Accesor estable para SearchableSelect (evita recalcular la búsqueda en cada render)
const comoTexto = (valor: string) => valor;

export const IncorporacionEquipoModal: React.FC<Props> = ({ visible, onClose, onCreated }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const modelos = useModelosMaquina(visible);
  const opcionesMaquina = useOpcionesMaquina(visible);
  const operadores = useOperadoresAsignables(visible);
  const successColor = colorScheme === 'dark' ? '#81c995' : theme.success;

  const [numEquipos, setNumEquipos] = useState<1 | 2>(1);
  const [activeTabIdx, setActiveTabIdx] = useState<0 | 1>(0);

  const [equipo1, setEquipo1] = useState<EquipoFormState>(EQUIPO_FORM_INICIAL);
  const [equipo2, setEquipo2] = useState<EquipoFormState>(EQUIPO_FORM_INICIAL);

  const [motivo, setMotivo] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [guardando, setGuardando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  // Validaciones
  const isEquipoValid = (eq: EquipoFormState) => {
    const horometro = Number(eq.horometro);
    return eq.codigo.trim() !== '' &&
      eq.patente.trim() !== '' &&
      eq.marca.trim() !== '' &&
      eq.modelo.trim() !== '' &&
      eq.tipoMaquina.trim() !== '' &&
      eq.horometro.trim() !== '' && Number.isFinite(horometro) && horometro >= 0 &&
      (eq.anio === '' || eq.anio.length === 4);
  };

  // El motivo es obligatorio: justifica la incorporación en la bitácora del jefe de turno
  const isFormValid = () => {
    const isE1Valid = isEquipoValid(equipo1);
    const isE2Valid = numEquipos === 2 ? isEquipoValid(equipo2) : true;
    return isE1Valid && isE2Valid && motivo !== '';
  };

  const reiniciar = () => {
    setEquipo1(EQUIPO_FORM_INICIAL);
    setEquipo2(EQUIPO_FORM_INICIAL);
    setNumEquipos(1);
    setActiveTabIdx(0);
    setMotivo('');
    setObservaciones('');
    setErrorEnvio(null);
  };

  const cerrar = () => {
    if (guardando) return;
    setErrorEnvio(null);
    onClose();
  };

  const handleSubmit = async () => {
    const equipos = numEquipos === 1 ? [equipo1] : [equipo1, equipo2];
    if (numEquipos === 2 && equipo1.codigo.trim().toUpperCase() === equipo2.codigo.trim().toUpperCase()) {
      setErrorEnvio('Los dos equipos tienen el mismo código interno.');
      return;
    }
    // Un operador está a cargo de una sola máquina: el segundo equipo se lo quitaría al primero
    if (numEquipos === 2 && equipo1.operadorId !== '' && equipo1.operadorId === equipo2.operadorId) {
      setErrorEnvio('Los dos equipos tienen el mismo operador asignado.');
      return;
    }

    setGuardando(true);
    setErrorEnvio(null);
    let creados = 0;
    try {
      for (const equipo of equipos) {
        // En una dupla ambos equipos quedan en la bitácora con el mismo motivo y observación
        await crearMaquina({ ...aCrearMaquina(equipo), motivo, observacion: observaciones.trim() || null });
        creados++;
        onCreated?.();
      }
      reiniciar();
      onClose();
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No se pudo incorporar el equipo.';
      if (creados === 1) {
        // El equipo #1 ya quedó registrado: se deja en el formulario solo el que falló
        setErrorEnvio(`${equipo1.codigo.trim().toUpperCase()} se incorporó, pero el equipo #2 no: ${mensaje}`);
        setEquipo1(equipo2);
        setEquipo2(EQUIPO_FORM_INICIAL);
        setNumEquipos(1);
        setActiveTabIdx(0);
      } else {
        setErrorEnvio(mensaje);
      }
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
      <TouchableOpacity
        style={[styles.btnSecundario, { backgroundColor: theme.cardAlt }]}
        onPress={cerrar}
        disabled={guardando}
      >
        <Text style={[styles.btnSecundarioText, { color: theme.text }]}>Cancelar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btnPrimario, { backgroundColor: theme.primary, opacity: isFormValid() && !guardando ? 1 : 0.5 }]}
        onPress={handleSubmit}
        disabled={!isFormValid() || guardando}
      >
        {guardando ? <ActivityIndicator color="#FFF" /> : <CheckCircle size={18} color="#FFF" />}
        <Text style={styles.btnPrimarioText}>{guardando ? 'Incorporando...' : `Incorporar ${numEquipos} a Planta`}</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <AppBottomSheetModal
      visible={visible}
      onClose={cerrar}
      title="Incorporación de Equipo a Planta"
      subtitle={`Suma ${numEquipos} equipo${numEquipos > 1 ? 's' : ''} nuev${numEquipos > 1 ? 'os' : 'o'} a la flota activa`}
      icon={<PlusCircle size={22} color={theme.primary} />}
      iconBadgeColor={theme.primary + '15'}
      headerTop={headerTop}
      footer={renderFooter()}
      modalStyle={{ width: '95%', maxWidth: 700, maxHeight: '92%' }}
    >
      <View style={[styles.section, styles.capsuleSection, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>¿CUÁNTOS EQUIPOS ENTRAN A OPERAR EN ESTA ACCIÓN?</Text>
        <View style={styles.cardsRow}>
          <TouchableOpacity
            style={[styles.qtyCard, { backgroundColor: theme.card, borderColor: 'transparent' }, numEquipos === 1 && { borderColor: theme.primary, backgroundColor: theme.primary + '10' }]}
            onPress={() => {
              setNumEquipos(1);
              setActiveTabIdx(0);
            }}
          >
            <View style={styles.qtyTitleRow}>
              <Text style={[styles.qtyTitle, { color: numEquipos === 1 ? theme.primary : theme.text }]}>1 Equipo Entrante</Text>
            </View>
            <Text style={[styles.qtySubtitle, { color: theme.textSecondary }]}>Ingreso individual a planta</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.qtyCard, { backgroundColor: theme.card, borderColor: 'transparent' }, numEquipos === 2 && { borderColor: theme.warning, backgroundColor: theme.warning + '10' }]}
            onPress={() => setNumEquipos(2)}
          >
            <View style={styles.qtyTitleRow}>
              <Text style={[styles.qtyTitle, { color: numEquipos === 2 ? theme.warning : theme.text }]}>2 Equipos (Dupla)</Text>
            </View>
            <Text style={[styles.qtySubtitle, { color: theme.textSecondary }]}>Incorporar 2 equipos a planta</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.section, styles.capsuleSection, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Truck size={16} color={successColor} />
            <Text style={[styles.sectionTitle, { color: successColor, marginBottom: 0 }]}>2. DATOS DE MAQUINARIA PARA PLANTA</Text>
          </View>

          {/* Custom Tabs */}
          <View style={[styles.tabsContainer, { backgroundColor: theme.cardAlt, borderWidth: 1, borderColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.tab, activeTabIdx === 0 && { backgroundColor: theme.card, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 }]}
              onPress={() => setActiveTabIdx(0)}
            >
              <Text style={[styles.tabText, { color: activeTabIdx === 0 ? theme.primary : theme.textSecondary }]}>
                {equipo1.codigo ? `Eq. #1 (${equipo1.codigo})` : 'Equipo #1'}
              </Text>
            </TouchableOpacity>
            {numEquipos === 2 && (
              <TouchableOpacity
                style={[styles.tab, activeTabIdx === 1 && { backgroundColor: theme.card, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 }]}
                onPress={() => setActiveTabIdx(1)}
              >
                <Text style={[styles.tabText, { color: activeTabIdx === 1 ? theme.primary : theme.textSecondary }]}>
                  {equipo2.codigo ? `Eq. #2 (${equipo2.codigo})` : 'Equipo #2'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.tabContent}>
          {activeTabIdx === 0 ? (
            <EquipoDataForm
              equipoIdx={0}
              state={equipo1}
              onChange={setEquipo1}
              plantillas={modelos.plantillas}
              cargandoPlantillas={modelos.cargando}
              errorPlantillas={modelos.error}
              opciones={opcionesMaquina}
              operadores={operadores}
            />
          ) : (
            <EquipoDataForm
              equipoIdx={1}
              state={equipo2}
              onChange={setEquipo2}
              plantillas={modelos.plantillas}
              cargandoPlantillas={modelos.cargando}
              errorPlantillas={modelos.error}
              opciones={opcionesMaquina}
              operadores={operadores}
            />
          )}
        </View>
      </View>

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
            options={MOTIVOS_INCORPORACION}
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
            placeholder="Ej. Refuerzo del frente de carguío para cumplir la meta diaria de tonelaje."
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
