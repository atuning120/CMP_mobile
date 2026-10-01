import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, useColorScheme, TextInput } from 'react-native';
import { AppBottomSheetModal } from '../common/AppBottomSheetModal';
import { Edit2, CheckCircle, MapPin, ChevronDown, Activity, User } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { MaquinaFlota, EstadoOperativo } from '../../hooks/useFlotaResumen';
import { styles } from './EditarEquipoModal.styles';

interface Props {
  visible: boolean;
  onClose: () => void;
  maquina: MaquinaFlota | null;
  onSave?: (maquinaActualizada: MaquinaFlota) => void;
}

// Mocks (Reusing from other components)
const MOCK_ZONAS = [
  { id_area: 1, id_zona: 1, nombre: 'Fase 4 - Banco 320' },
  { id_area: 1, id_zona: 2, nombre: 'Fase 4 - Rampa Sur' },
  { id_area: 2, id_zona: 3, nombre: 'Botadero Norte' },
  { id_area: 3, id_zona: 4, nombre: 'Chancador Primario' },
];

const MOCK_OPERADORES = [
  { id: '1', nombre: 'Cristian Núñez', rut: '15.123.456-7', turno: 'Turno A - Día' },
  { id: '2', nombre: 'María López', rut: '16.987.654-3', turno: 'Turno B - Noche' },
  { id: '3', nombre: 'Carlos Díaz', rut: '14.555.222-1', turno: 'Turno A - Día' },
  { id: '4', nombre: 'Sin operador asignado', rut: '', turno: '' }
];

export const EditarEquipoModal: React.FC<Props> = ({ visible, onClose, maquina, onSave }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const [codigo, setCodigo] = useState('');
  const [patente, setPatente] = useState('');
  const [estadoOperativo, setEstadoOperativo] = useState<EstadoOperativo>('OPERATIVO');
  const [marcaModelo, setMarcaModelo] = useState('');
  const [chasis, setChasis] = useState('');
  const [horometro, setHorometro] = useState('');
  const [combustible, setCombustible] = useState('');
  const [zona, setZona] = useState('');
  const [operador, setOperador] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<'estado' | 'zona' | 'operador' | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (maquina && visible) {
      setCodigo(maquina.codigo);
      setPatente(maquina.patente);
      setEstadoOperativo(maquina.estadoOperativo);
      setMarcaModelo(maquina.marcaModelo);
      setChasis('');
      setHorometro(maquina.horometroActual.toString());
      setCombustible(maquina.combustible ? maquina.combustible.porcentaje.toString() : '');
      setZona(maquina.zonaActual || '');
      setOperador(maquina.operadorAsignado || '');
      setObservaciones(maquina.fallaActiva || '');
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [maquina, visible]);

  const isValid = codigo.trim() !== '' && patente.trim() !== '' && marcaModelo.trim() !== '' && horometro.trim() !== '';

  const handleSave = () => {
    if (!maquina) return;

    const updated: MaquinaFlota = {
      ...maquina,
      codigo,
      patente,
      estadoOperativo,
      marcaModelo,
      horometroActual: parseFloat(horometro) || maquina.horometroActual,
      combustible: combustible ? { porcentaje: parseInt(combustible, 10), tipo: maquina.combustible?.tipo || 'Petróleo' } : null,
      zonaActual: zona,
      operadorAsignado: operador,
      fallaActiva: estadoOperativo === 'FUERA_DE_SERVICIO' ? observaciones : null
    };

    if (onSave) {
      onSave(updated);
    }

    // TODO: conectar con el endpoint real de edición de equipo cuando el backend lo exponga (incluye los mismos GAPs ya identificados: patente, VIN, combustible, estado_operativo)
    onClose();
  };

  if (!maquina) return null;

  const renderFooter = () => (
    <>
      <TouchableOpacity
        style={[styles.btnSecundario, { backgroundColor: theme.cardAlt }]}
        onPress={onClose}
      >
        <Text style={[styles.btnSecundarioText, { color: theme.text }]}>Cancelar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btnPrimario, { backgroundColor: theme.primary, opacity: isValid ? 1 : 0.5 }]}
        onPress={handleSave}
        disabled={!isValid}
      >
        <CheckCircle size={18} color="#FFF" />
        <Text style={styles.btnPrimarioText}>Guardar Cambios</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <AppBottomSheetModal
      visible={visible}
      onClose={onClose}
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
      <View style={[styles.capsuleSection, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>

        {/* Fila 1 */}
        <View style={[styles.row, { zIndex: 10 }]}>
          <View style={[styles.fieldCol, { flex: 1 }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>CÓDIGO INTERNO (TAG) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={codigo}
              onChangeText={setCodigo}
            />
          </View>
          <View style={[styles.fieldCol, { flex: 1 }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>PATENTE REGISTRADA *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={patente}
              onChangeText={setPatente}
            />
          </View>
        </View>

        {/* Fila 2 */}
        <View style={[styles.fieldFull, { zIndex: 9 }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>ESTADO OPERACIONAL *</Text>
          <TouchableOpacity
            style={[
              styles.dropdownSelector, 
              { backgroundColor: theme.background, borderColor: activeDropdown === 'estado' ? theme.primary : theme.border }
            ]}
            onPress={() => setActiveDropdown(activeDropdown === 'estado' ? null : 'estado')}
          >
            <View style={styles.dropdownSelectorInner}>
              <Activity size={16} color={estadoOperativo === 'OPERATIVO' ? theme.success : theme.danger} />
              <Text style={[styles.dropdownText, { color: theme.text }]} numberOfLines={1}>
                {estadoOperativo === 'OPERATIVO' ? 'Operativo (En Servicio)' : 'Fuera de Servicio (Detenido)'}
              </Text>
            </View>
            <ChevronDown size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          {activeDropdown === 'estado' && (
            <View style={[styles.dropdownOptionsContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.dropdownOption, styles.dropdownOptionBorder, { borderBottomColor: theme.border }]}
                onPress={() => { setEstadoOperativo('OPERATIVO'); setActiveDropdown(null); }}
              >
                <Activity size={16} color={theme.success} />
                <Text style={[styles.dropdownOptionText, { color: estadoOperativo === 'OPERATIVO' ? theme.primary : theme.text }]}>Operativo (En Servicio)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={() => { setEstadoOperativo('FUERA_DE_SERVICIO'); setActiveDropdown(null); }}
              >
                <Activity size={16} color={theme.danger} />
                <Text style={[styles.dropdownOptionText, { color: estadoOperativo === 'FUERA_DE_SERVICIO' ? theme.primary : theme.text }]}>Fuera de Servicio (Detenido)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Fila 3 */}
        <View style={[styles.fieldFull, { zIndex: 8 }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>MODELO DE LA MÁQUINA*</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            value={marcaModelo}
            onChangeText={setMarcaModelo}
          />
        </View>

        {/* Fila 4 */}
        <View style={[styles.row, { zIndex: 7 }]}>
          <View style={[styles.fieldCol, { flex: 1 }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>N° CHASIS / SERIE (VIN)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={chasis}
              onChangeText={setChasis}
              placeholder="Opcional"
              placeholderTextColor={theme.textTertiary}
            />
          </View>
          <View style={[styles.fieldCol, { flex: 1 }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>HORÓMETRO ACTUAL *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={horometro}
              onChangeText={(v) => setHorometro(v.replace(/[^0-9.]/g, ''))}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Fila 5 */}
        <View style={[styles.fieldFull, { zIndex: 6 }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>UBICACIÓN / ZONA EN PLANTA</Text>
          <TouchableOpacity
            style={[
              styles.dropdownSelector, 
              { backgroundColor: theme.background, borderColor: activeDropdown === 'zona' ? theme.primary : theme.border }
            ]}
            onPress={() => setActiveDropdown(activeDropdown === 'zona' ? null : 'zona')}
          >
            <View style={styles.dropdownSelectorInner}>
              <MapPin size={16} color={theme.textSecondary} />
              <Text style={[styles.dropdownText, { color: theme.text }]} numberOfLines={1}>
                {zona || 'Seleccionar...'}
              </Text>
            </View>
            <ChevronDown size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          {activeDropdown === 'zona' && (
            <View style={[styles.dropdownOptionsContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
              {MOCK_ZONAS.map((z, idx) => (
                <TouchableOpacity
                  key={z.id_zona}
                  style={[
                    styles.dropdownOption,
                    idx < MOCK_ZONAS.length - 1 && styles.dropdownOptionBorder,
                    { borderBottomColor: theme.border }
                  ]}
                  onPress={() => { setZona(z.nombre); setActiveDropdown(null); }}
                >
                  <MapPin size={16} color={zona === z.nombre ? theme.primary : theme.textSecondary} />
                  <Text style={[styles.dropdownOptionText, { color: zona === z.nombre ? theme.primary : theme.text }]}>{z.nombre}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Fila 6 */}
        <View style={[styles.fieldFull, { zIndex: 5 }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>OPERADOR RESPONSABLE</Text>
          <TouchableOpacity
            style={[
              styles.dropdownSelector, 
              { backgroundColor: theme.background, borderColor: activeDropdown === 'operador' ? theme.primary : theme.border }
            ]}
            onPress={() => setActiveDropdown(activeDropdown === 'operador' ? null : 'operador')}
          >
            <View style={styles.dropdownSelectorInner}>
              <User size={16} color={theme.textSecondary} />
              <Text style={[styles.dropdownText, { color: theme.text }]} numberOfLines={1}>
                {operador || 'Seleccionar...'}
              </Text>
            </View>
            <ChevronDown size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          {activeDropdown === 'operador' && (
            <View style={[styles.dropdownOptionsContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
              {MOCK_OPERADORES.map((o, idx) => (
                <TouchableOpacity
                  key={o.id}
                  style={[
                    styles.dropdownOption,
                    idx < MOCK_OPERADORES.length - 1 && styles.dropdownOptionBorder,
                    { borderBottomColor: theme.border }
                  ]}
                  onPress={() => { setOperador(o.nombre); setActiveDropdown(null); }}
                >
                  <User size={16} color={operador === o.nombre ? theme.primary : theme.textSecondary} />
                  <Text style={[styles.dropdownOptionText, { color: operador === o.nombre ? theme.primary : theme.text }]}>
                    {o.nombre} {o.rut ? `(${o.rut})` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Fila 7 */}
        <View style={[styles.fieldFull, { zIndex: 4 }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>NOTAS Y OBSERVACIONES DE TERRENO</Text>
          <TextInput
            style={[styles.textarea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            value={observaciones}
            onChangeText={setObservaciones}
            placeholder="Detalles adicionales sobre el equipo, reparaciones pendientes, etc."
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
