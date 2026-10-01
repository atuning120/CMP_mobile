import React, { useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme, TextInput, ScrollView } from 'react-native';
import { AppBottomSheetModal } from '../common/AppBottomSheetModal';
import { PlusCircle, CheckCircle, MapPin, Briefcase } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { EquipoDataForm, EquipoFormState, PlantillaEquipo, EquipoPatio } from './EquipoDataForm';
import { styles } from './IncorporacionEquipoModal.styles';

interface Props {
  visible: boolean;
  onClose: () => void;
}

// Mocks
const MOCK_PLANTILLAS: PlantillaEquipo[] = [
  { id: 'p1', nombreCorto: 'CAT 793F (240T)', marcaModelo: 'Caterpillar 793F High Altitude', horometroSugerido: 0 },
  { id: 'p2', nombreCorto: 'Komatsu 930E (290T)', marcaModelo: 'Komatsu 930E-4', horometroSugerido: 0 },
  { id: 'p3', nombreCorto: 'Pala Liebherr R9800', marcaModelo: 'Liebherr R9800', horometroSugerido: 0 },
  { id: 'p4', nombreCorto: 'Dozer D11T', marcaModelo: 'Caterpillar D11T', horometroSugerido: 0 },
];

const MOCK_PATIO: EquipoPatio[] = [
  { id: 'e1', codigo: 'CAEX-210', patente: 'AB-CD-12', marcaModelo: 'Caterpillar 793F', horometroActual: 4500, combustible: 85, contratista: false },
  { id: 'e2', codigo: 'CAEX-211', patente: 'EF-GH-34', marcaModelo: 'Caterpillar 793F', horometroActual: 4600, combustible: 90, contratista: false },
  { id: 'e3', codigo: 'EXCA-05', patente: 'XX-YY-99', marcaModelo: 'Komatsu PC4000', horometroActual: 12000, combustible: 40, contratista: true },
];

const MOCK_ZONAS = [
  { id_area: 1, id_zona: 1, nombre: 'Fase 4 - Banco 320' },
  { id_area: 1, id_zona: 2, nombre: 'Fase 4 - Rampa Sur' },
  { id_area: 2, id_zona: 3, nombre: 'Botadero Norte' },
  { id_area: 3, id_zona: 4, nombre: 'Chancador Primario' },
];

const MOCK_MOTIVOS = [
  'Aumento de Capacidad / Flota de Producción',
  'Reemplazo Temporal por Falla',
  'Prueba Técnica de Equipo',
  'Requerimiento Especial de Gerencia',
];

const INITIAL_EQUIPO_STATE: EquipoFormState = {
  codigo: '',
  patente: '',
  marcaModelo: '',
  horometro: '',
  combustible: '',
  chasis: '',
  operadorId: '',
  contratista: false,
  fuenteDatos: 'NUEVO',
};

export const IncorporacionEquipoModal: React.FC<Props> = ({ visible, onClose }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const [numEquipos, setNumEquipos] = useState<1 | 2>(1);
  const [activeTabIdx, setActiveTabIdx] = useState<0 | 1>(0);

  const [equipo1, setEquipo1] = useState<EquipoFormState>(INITIAL_EQUIPO_STATE);
  const [equipo2, setEquipo2] = useState<EquipoFormState>(INITIAL_EQUIPO_STATE);

  const [destinoZonaId, setDestinoZonaId] = useState<number | null>(null);
  const [motivo, setMotivo] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');

  // Validaciones
  const isEquipoValid = (eq: EquipoFormState) => {
    return eq.codigo.trim() !== '' && 
           eq.patente.trim() !== '' && 
           eq.marcaModelo.trim() !== '' && 
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
    setEquipo1(INITIAL_EQUIPO_STATE);
    setEquipo2(INITIAL_EQUIPO_STATE);
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
      title="Incorporación de Equipo a Planta"
      subtitle={`Suma ${numEquipos} equipo${numEquipos > 1 ? 's' : ''} nuev${numEquipos > 1 ? 'os' : 'o'} a la flota activa`}
      icon={<PlusCircle size={22} color={theme.primary} />}
      iconBadgeColor={theme.primary + '15'}
      headerTop={headerTop}
      footer={renderFooter()}
      modalStyle={{ width: '95%', maxWidth: 700, maxHeight: '92%' }}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>¿CUÁNTOS EQUIPOS ENTRAN A OPERAR EN ESTA ACCIÓN?</Text>
        <View style={styles.cardsRow}>
          <TouchableOpacity 
            style={[styles.qtyCard, { backgroundColor: theme.cardAlt, borderColor: theme.border }, numEquipos === 1 && { borderColor: theme.primary, backgroundColor: theme.primary + '10' }]}
            onPress={() => {
              setNumEquipos(1);
              setActiveTabIdx(0);
            }}
          >
            <Text style={[styles.qtyTitle, { color: numEquipos === 1 ? theme.primary : theme.text }]}>1 Equipo Entrante</Text>
            <Text style={[styles.qtySubtitle, { color: theme.textSecondary }]}>Ingreso individual a planta</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.qtyCard, { backgroundColor: theme.cardAlt, borderColor: theme.border }, numEquipos === 2 && { borderColor: theme.primary, backgroundColor: theme.primary + '10' }]}
            onPress={() => setNumEquipos(2)}
          >
            <Text style={[styles.qtyTitle, { color: numEquipos === 2 ? theme.primary : theme.text }]}>2 Equipos (Dupla)</Text>
            <Text style={[styles.qtySubtitle, { color: theme.textSecondary }]}>Incorporar 2 equipos a planta</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>DATOS DE MAQUINARIA PARA PLANTA</Text>
        
        {/* Custom Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTabIdx === 0 && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]}
            onPress={() => setActiveTabIdx(0)}
          >
            <Text style={[styles.tabText, { color: activeTabIdx === 0 ? theme.primary : theme.textSecondary }]}>
              {equipo1.codigo ? `Equipo #1 (${equipo1.codigo})` : 'Equipo #1'}
            </Text>
          </TouchableOpacity>
          {numEquipos === 2 && (
            <TouchableOpacity 
              style={[styles.tab, activeTabIdx === 1 && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]}
              onPress={() => setActiveTabIdx(1)}
            >
              <Text style={[styles.tabText, { color: activeTabIdx === 1 ? theme.primary : theme.textSecondary }]}>
                {equipo2.codigo ? `Equipo #2 (${equipo2.codigo})` : 'Equipo #2'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabContent}>
          {activeTabIdx === 0 ? (
            <EquipoDataForm 
              equipoIdx={0}
              state={equipo1}
              onChange={setEquipo1}
              plantillas={MOCK_PLANTILLAS}
              equiposPatio={MOCK_PATIO}
            />
          ) : (
            <EquipoDataForm 
              equipoIdx={1}
              state={equipo2}
              onChange={setEquipo2}
              plantillas={MOCK_PLANTILLAS}
              equiposPatio={MOCK_PATIO}
            />
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>DESTINO EN PLANTA Y OBSERVACIONES</Text>
        
        <View style={styles.fieldFull}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>UBICACIÓN / FASE DESTINO EN MINA *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
            {MOCK_ZONAS.map(z => (
              <TouchableOpacity
                key={z.id_zona}
                style={[
                  styles.chip,
                  { backgroundColor: theme.cardAlt, borderColor: theme.border },
                  destinoZonaId === z.id_zona && { backgroundColor: theme.primary + '20', borderColor: theme.primary }
                ]}
                onPress={() => setDestinoZonaId(z.id_zona)}
              >
                <MapPin size={14} color={destinoZonaId === z.id_zona ? theme.primary : theme.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.chipText, { color: destinoZonaId === z.id_zona ? theme.primary : theme.text }]}>
                  {z.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.fieldFull}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>MOTIVO / JUSTIFICACIÓN DEL JEFE DE TURNO *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
            {MOCK_MOTIVOS.map((m, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.chip,
                  { backgroundColor: theme.cardAlt, borderColor: theme.border },
                  motivo === m && { backgroundColor: theme.primary + '20', borderColor: theme.primary }
                ]}
                onPress={() => setMotivo(m)}
              >
                <Briefcase size={14} color={motivo === m ? theme.primary : theme.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.chipText, { color: motivo === m ? theme.primary : theme.text }]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.fieldFull}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>OBSERVACIONES (OPCIONAL)</Text>
          <TextInput
            style={[styles.textarea, { backgroundColor: theme.cardAlt, color: theme.text, borderColor: theme.border }]}
            value={observaciones}
            onChangeText={setObservaciones}
            placeholder="Añade algún comentario adicional..."
            placeholderTextColor={theme.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={[styles.authBlock, { backgroundColor: theme.cardAlt }]}>
          <Text style={[styles.authText, { color: theme.textSecondary }]}>
            Autoriza: <Text style={{ fontWeight: 'bold', color: theme.text }}>Cristian Núñez (15.123.456-7)</Text>
          </Text>
          <Text style={[styles.authText, { color: theme.textSecondary }]}>
            Hora: {new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

      </View>
    </AppBottomSheetModal>
  );
};
