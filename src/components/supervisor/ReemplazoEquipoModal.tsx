import React, { useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme, TextInput } from 'react-native';
import { AppBottomSheetModal } from '../common/AppBottomSheetModal';
import { CheckCircle, MapPin, Truck, Wrench, ChevronDown, AlertCircle, Gauge, RefreshCw } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { EQUIPO_FORM_INICIAL, EquipoDataForm, EquipoFormState } from './EquipoDataForm';
import { useModelosMaquina } from '../../hooks/useModelosMaquina';
import { useOpcionesMaquina } from '../../hooks/useOpcionesMaquina';
import { styles } from './ReemplazoEquipoModal.styles';

interface Props {
  visible: boolean;
  onClose: () => void;
}



const MOCK_ZONAS = [
  { id_area: 1, id_zona: 1, nombre: 'Fase 4 - Banco 320' },
  { id_area: 1, id_zona: 2, nombre: 'Fase 4 - Rampa Sur' },
  { id_area: 2, id_zona: 3, nombre: 'Botadero Norte' },
  { id_area: 3, id_zona: 4, nombre: 'Chancador Primario' },
];

const MOCK_MOTIVOS = ['Aumento de Capacidad / Flota', 'Reemplazo por Falla', 'Mantención Programada'];
const MOCK_MAQUINAS_RETIRAR = ['CAEX-204 - Caterpillar 793F', 'CAEX-205 - Komatsu 930E', 'EX-02 - CAT 349D2 L'];



export const ReemplazoEquipoModal: React.FC<Props> = ({ visible, onClose }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const modelos = useModelosMaquina(visible);
  const opcionesMaquina = useOpcionesMaquina(visible);
  const successColor = colorScheme === 'dark' ? '#81c995' : theme.success;

  const [numEquipos, setNumEquipos] = useState<1 | 2>(1);
  const [activeTabIdx, setActiveTabIdx] = useState<0 | 1>(0);

  const [equipo1, setEquipo1] = useState<EquipoFormState>(EQUIPO_FORM_INICIAL);
  const [equipo2, setEquipo2] = useState<EquipoFormState>(EQUIPO_FORM_INICIAL);

  const [destinoZonaId, setDestinoZonaId] = useState<number | null>(null);
  const [motivo, setMotivo] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [activeDropdown, setActiveDropdown] = useState<'maquina' | 'zona' | 'motivo' | null>(null);
  const [maquinaRetirar, setMaquinaRetirar] = useState(MOCK_MAQUINAS_RETIRAR[0]);

  // Validaciones
  const isEquipoValid = (eq: EquipoFormState) => {
    return eq.codigo.trim() !== '' &&
      eq.patente.trim() !== '' &&
      eq.marca.trim() !== '' &&
      eq.modelo.trim() !== '' &&
      eq.tipoMaquina.trim() !== '' &&
      eq.horometro.trim() !== '' &&
      eq.operadorId !== '';
  };

  const isFormValid = () => {
    const isE1Valid = isEquipoValid(equipo1);
    const isE2Valid = numEquipos === 2 ? isEquipoValid(equipo2) : true;
    const isDestinoValid = destinoZonaId !== null && motivo !== '';
    return isE1Valid && isE2Valid && isDestinoValid;
  };

  const handleSubmit = () => {
    const payload = {
      equipos: numEquipos === 1 ? [equipo1] : [equipo1, equipo2],
      destino: {
        zonaId: destinoZonaId,
        motivo: motivo,
        observaciones: observaciones,
      },
      autorizadoPor: 'Cristian Núñez (15.123.456-7)', // Mock from session
      timestamp: new Date().toISOString(),
    };

    console.log('Payload de Incorporación:', JSON.stringify(payload, null, 2));
    // TODO: conectar con el endpoint real de incorporación de equipos cuando el backend lo exponga

    // Reset and close
    setEquipo1(EQUIPO_FORM_INICIAL);
    setEquipo2(EQUIPO_FORM_INICIAL);
    setNumEquipos(1);
    setActiveTabIdx(0);
    setDestinoZonaId(null);
    setMotivo('');
    setObservaciones('');
    onClose();
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
        onPress={onClose}
      >
        <Text style={[styles.btnSecundarioText, { color: theme.text }]}>Cancelar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btnPrimario, { backgroundColor: theme.primary, opacity: isFormValid() ? 1 : 0.5 }]}
        onPress={handleSubmit}
        disabled={!isFormValid()}
      >
        <CheckCircle size={18} color="#FFF" />
        <Text style={styles.btnPrimarioText}>Incorporar {numEquipos} a Planta</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <AppBottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Reemplazo de Equipo"
      subtitle={`Registra la salida y sustitución de ${numEquipos} equipo${numEquipos > 1 ? 's' : ''}`}
      icon={<RefreshCw size={22} color={theme.warning} />}
      iconBadgeColor={theme.warning + '15'}
      headerTop={headerTop}
      footer={renderFooter()}
      modalStyle={{ width: '95%', maxWidth: 700, maxHeight: '92%' }}
    >

      <View style={[styles.section, styles.capsuleSection, {
        backgroundColor: theme.danger + '08',
        borderColor: theme.danger + '60',
        borderWidth: 1.5,
        zIndex: 10
      }]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <AlertCircle size={18} color={theme.danger} />
            <Text style={[styles.sectionTitle, { color: theme.danger, marginBottom: 0, fontWeight: 'bold' }]}>2. EQUIPO SALIENTE (FUERA DE SERVICIO)</Text>
          </View>
        </View>
        <View style={[styles.cardsRow, { gap: 16 }]}>
          <View style={[styles.fieldCol, { flex: 2, zIndex: 10 }]}>
            <Text style={[styles.label, { color: theme.textSecondary, fontSize: 10, letterSpacing: 0.5 }]}>MÁQUINA A RETIRAR:</Text>
            <TouchableOpacity
              style={[styles.dropdownSelector, { backgroundColor: theme.cardAlt, borderColor: activeDropdown === 'maquina' ? theme.primary : theme.border }]}
              onPress={() => setActiveDropdown(activeDropdown === 'maquina' ? null : 'maquina')}
            >
              <View style={styles.dropdownSelectorInner}>
                <Text style={[styles.dropdownText, { color: theme.text }]} numberOfLines={1}>{maquinaRetirar}</Text>
              </View>
              <ChevronDown size={18} color={theme.textSecondary} />
            </TouchableOpacity>
            {activeDropdown === 'maquina' && (
              <View style={[styles.dropdownOptionsContainer, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
                {MOCK_MAQUINAS_RETIRAR.map((m, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.dropdownOption, idx < MOCK_MAQUINAS_RETIRAR.length - 1 && styles.dropdownOptionBorder, { borderBottomColor: theme.border }]}
                    onPress={() => { setMaquinaRetirar(m); setActiveDropdown(null); }}
                  >
                    <Text style={[styles.dropdownText, { color: maquinaRetirar === m ? theme.primary : theme.text }]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <View style={[styles.fieldCol, { flex: 1.5, zIndex: 9 }]}>
            <Text style={[styles.label, { color: theme.textSecondary, fontSize: 10, letterSpacing: 0.5 }]}>HORÓMETRO SALIDA:</Text>
            <View style={[styles.input, { backgroundColor: theme.cardAlt, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
              <Gauge size={16} color={theme.textSecondary} />
              <TextInput
                style={{ flex: 1, color: theme.text, fontSize: 14, fontWeight: '500', padding: 0 }}
                value="14280,5"
                placeholderTextColor={theme.textTertiary}
              />
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.section, styles.capsuleSection, { backgroundColor: theme.cardAlt, borderColor: theme.border, zIndex: 9 }]}>
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

      <View style={[styles.section, styles.capsuleSection, { backgroundColor: theme.cardAlt, borderColor: theme.border, zIndex: 8 }]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Truck size={16} color={successColor} />
            <Text style={[styles.sectionTitle, { color: successColor, marginBottom: 0 }]}>3. DATOS DE MAQUINARIA PARA PLANTA</Text>
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
            />
          )}
        </View>
      </View>

      <View style={[styles.section, styles.capsuleSection, { backgroundColor: theme.cardAlt, borderColor: theme.border, zIndex: 7 }]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Wrench size={16} color={theme.warning} />
            <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginBottom: 0 }]}>4. DESTINO EN PLANTA Y OBSERVACIONES</Text>
          </View>
        </View>

        <View style={[styles.fieldFull, { zIndex: 10 }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>UBICACIÓN / FASE DESTINO EN MINA:</Text>
          <TouchableOpacity
            style={[styles.dropdownSelector, { backgroundColor: theme.background, borderColor: activeDropdown === 'zona' ? theme.primary : theme.border }]}
            onPress={() => setActiveDropdown(activeDropdown === 'zona' ? null : 'zona')}
          >
            <View style={styles.dropdownSelectorInner}>
              <MapPin size={16} color={theme.textSecondary} />
              <Text style={[styles.dropdownText, { color: theme.text }]}>
                {destinoZonaId ? MOCK_ZONAS.find(z => z.id_zona === destinoZonaId)?.nombre : 'Fase 4 - Banco 320 (Rampa Sur)'}
              </Text>
            </View>
            <ChevronDown size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          {activeDropdown === 'zona' && (
            <View style={[styles.dropdownOptionsContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
              {MOCK_ZONAS.map((z, idx) => (
                <TouchableOpacity
                  key={z.id_zona}
                  style={[styles.dropdownOption, idx < MOCK_ZONAS.length - 1 && styles.dropdownOptionBorder, { borderBottomColor: theme.border }]}
                  onPress={() => { setDestinoZonaId(z.id_zona); setActiveDropdown(null); }}
                >
                  <MapPin size={16} color={destinoZonaId === z.id_zona ? theme.primary : theme.textSecondary} />
                  <Text style={[styles.dropdownText, { color: destinoZonaId === z.id_zona ? theme.primary : theme.text }]}>{z.nombre}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.fieldFull, { zIndex: 9 }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>MOTIVO / JUSTIFICACIÓN DEL JEFE DE TURNO:</Text>
          <TouchableOpacity
            style={[styles.dropdownSelector, { backgroundColor: theme.background, borderColor: activeDropdown === 'motivo' ? theme.primary : theme.border }]}
            onPress={() => setActiveDropdown(activeDropdown === 'motivo' ? null : 'motivo')}
          >
            <View style={styles.dropdownSelectorInner}>
              <Text style={[styles.dropdownText, { color: theme.text }]}>
                {motivo || 'Aumento de Capacidad / Flota de Producción Planta'}
              </Text>
            </View>
            <ChevronDown size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          {activeDropdown === 'motivo' && (
            <View style={[styles.dropdownOptionsContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
              {MOCK_MOTIVOS.map((m, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dropdownOption, idx < MOCK_MOTIVOS.length - 1 && styles.dropdownOptionBorder, { borderBottomColor: theme.border }]}
                  onPress={() => { setMotivo(m); setActiveDropdown(null); }}
                >
                  <Text style={[styles.dropdownText, { color: motivo === m ? theme.primary : theme.text }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.fieldFull, { zIndex: 8 }]}>
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
    </AppBottomSheetModal>
  );
};
