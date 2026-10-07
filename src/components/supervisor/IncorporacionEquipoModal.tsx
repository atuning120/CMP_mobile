import React, { useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme, TextInput, ActivityIndicator } from 'react-native';
import { AppBottomSheetModal } from '../common/AppBottomSheetModal';
import { PlusCircle, CheckCircle, MapPin, Truck, Wrench, ChevronDown, AlertTriangle } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { EQUIPO_FORM_INICIAL, EquipoDataForm, EquipoFormState, PlantillaEquipo } from './EquipoDataForm';
import { styles } from './IncorporacionEquipoModal.styles';
import { crearMaquina } from '../../services/flotaService';

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
});

// Mocks
const MOCK_PLANTILLAS: PlantillaEquipo[] = [
  { id: 'p1', nombreCorto: 'CAT 793F (240T)', marca: 'Caterpillar', modelo: '793F High Altitude', tipoMaquina: 'Camión Tolva', horometroSugerido: 0 },
  { id: 'p2', nombreCorto: 'Komatsu 930E (290T)', marca: 'Komatsu', modelo: '930E-4', tipoMaquina: 'Camión Tolva', horometroSugerido: 0 },
  { id: 'p3', nombreCorto: 'Pala Liebherr R9800', marca: 'Liebherr', modelo: 'R9800', tipoMaquina: 'Pala', horometroSugerido: 0 },
  { id: 'p4', nombreCorto: 'Dozer D11T', marca: 'Caterpillar', modelo: 'D11T', tipoMaquina: 'Bulldozer', horometroSugerido: 0 },
];


const MOCK_ZONAS = [
  { id_area: 1, id_zona: 1, nombre: 'Fase 4 - Banco 320' },
  { id_area: 1, id_zona: 2, nombre: 'Fase 4 - Rampa Sur' },
  { id_area: 2, id_zona: 3, nombre: 'Botadero Norte' },
  { id_area: 3, id_zona: 4, nombre: 'Chancador Primario' },
];




export const IncorporacionEquipoModal: React.FC<Props> = ({ visible, onClose, onCreated }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const successColor = colorScheme === 'dark' ? '#81c995' : theme.success;

  const [numEquipos, setNumEquipos] = useState<1 | 2>(1);
  const [activeTabIdx, setActiveTabIdx] = useState<0 | 1>(0);

  const [equipo1, setEquipo1] = useState<EquipoFormState>(EQUIPO_FORM_INICIAL);
  const [equipo2, setEquipo2] = useState<EquipoFormState>(EQUIPO_FORM_INICIAL);

  const [destinoZonaId, setDestinoZonaId] = useState<number | null>(null);
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

  // El destino y el motivo aún no se guardan en el Backend, por eso no se exigen
  const isFormValid = () => {
    const isE1Valid = isEquipoValid(equipo1);
    const isE2Valid = numEquipos === 2 ? isEquipoValid(equipo2) : true;
    return isE1Valid && isE2Valid;
  };

  const reiniciar = () => {
    setEquipo1(EQUIPO_FORM_INICIAL);
    setEquipo2(EQUIPO_FORM_INICIAL);
    setNumEquipos(1);
    setActiveTabIdx(0);
    setDestinoZonaId(null);
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

    setGuardando(true);
    setErrorEnvio(null);
    // TODO: registrar destino, motivo y observaciones cuando exista dónde guardarlos
    let creados = 0;
    try {
      for (const equipo of equipos) {
        await crearMaquina(aCrearMaquina(equipo));
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
              plantillas={MOCK_PLANTILLAS}
            />
          ) : (
            <EquipoDataForm
              equipoIdx={1}
              state={equipo2}
              onChange={setEquipo2}
              plantillas={MOCK_PLANTILLAS}
            />
          )}
        </View>
      </View>

      <View style={[styles.section, styles.capsuleSection, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Wrench size={16} color={theme.warning} />
            <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginBottom: 0 }]}>3. DESTINO EN PLANTA Y OBSERVACIONES</Text>
          </View>
        </View>

        <View style={styles.fieldFull}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>UBICACIÓN / FASE DESTINO EN MINA:</Text>
          <TouchableOpacity style={[styles.dropdownSelector, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={styles.dropdownSelectorInner}>
              <MapPin size={16} color={theme.textSecondary} />
              <Text style={[styles.dropdownText, { color: theme.text }]}>
                {destinoZonaId ? MOCK_ZONAS.find(z => z.id_zona === destinoZonaId)?.nombre : 'Fase 4 - Banco 320 (Rampa Sur)'}
              </Text>
            </View>
            <ChevronDown size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.fieldFull}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>MOTIVO / JUSTIFICACIÓN DEL JEFE DE TURNO:</Text>
          <TouchableOpacity style={[styles.dropdownSelector, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={styles.dropdownSelectorInner}>
              <Text style={[styles.dropdownText, { color: theme.text }]}>
                {motivo || 'Aumento de Capacidad / Flota de Producción Planta'}
              </Text>
            </View>
            <ChevronDown size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.fieldFull}>
          <TextInput
            style={[styles.textarea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            value={observaciones}
            onChangeText={setObservaciones}
            placeholder="Incorporación autorizada de maquinaria adicional para reforzar frente de carguío y cumplir meta diaria de tonelaje."
            placeholderTextColor={theme.textTertiary}
            multiline
            numberOfLines={3}
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
