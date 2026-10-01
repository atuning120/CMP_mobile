import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, useColorScheme, Switch } from 'react-native';
import { PackageOpen, Sparkles, PlusCircle } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { styles } from './EquipoDataForm.styles';

export type FuenteDatos = 'NUEVO' | 'PLANTILLA' | 'PATIO';

export interface EquipoFormState {
  codigo: string;
  patente: string;
  marcaModelo: string;
  horometro: string;
  combustible: string;
  chasis: string;
  operadorId: string;
  contratista: boolean;
  fuenteDatos: FuenteDatos;
}

export interface PlantillaEquipo {
  id: string;
  nombreCorto: string;
  marcaModelo: string;
  horometroSugerido: number;
}

export interface EquipoPatio {
  id: string;
  codigo: string;
  patente: string;
  marcaModelo: string;
  horometroActual: number;
  combustible: number;
  contratista: boolean;
}

interface Props {
  equipoIdx: number;
  state: EquipoFormState;
  onChange: (newState: EquipoFormState) => void;
  plantillas: PlantillaEquipo[];
  equiposPatio: EquipoPatio[];
}

// Mocks locales de operadores para el dropdown (idealmente vendrían de un hook)
const MOCK_OPERADORES = [
  { id: '1', nombre: 'Cristian Núñez', rut: '15.123.456-7', turno: 'Turno A - Día' },
  { id: '2', nombre: 'María López', rut: '16.987.654-3', turno: 'Turno B - Noche' },
  { id: '3', nombre: 'Carlos Díaz', rut: '14.555.222-1', turno: 'Turno A - Día' },
];

export const EquipoDataForm: React.FC<Props> = ({ equipoIdx, state, onChange, plantillas, equiposPatio }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const updateField = (field: keyof EquipoFormState, value: any) => {
    onChange({ ...state, [field]: value });
  };

  const handleApplyPlantilla = (plantilla: PlantillaEquipo) => {
    onChange({
      ...state,
      marcaModelo: plantilla.marcaModelo,
      horometro: plantilla.horometroSugerido.toString(),
      fuenteDatos: 'PLANTILLA',
    });
  };

  const handleApplyPatio = (equipo: EquipoPatio) => {
    onChange({
      ...state,
      codigo: equipo.codigo,
      patente: equipo.patente,
      marcaModelo: equipo.marcaModelo,
      horometro: equipo.horometroActual.toString(),
      combustible: equipo.combustible.toString(),
      contratista: equipo.contratista,
      fuenteDatos: 'PATIO',
    });
  };

  return (
    <View style={styles.container}>
      {/* Fuente de Datos Selector */}
      <View style={styles.sourceSelectorRow}>
        <TouchableOpacity
          style={[styles.sourceBtn, state.fuenteDatos === 'NUEVO' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
          onPress={() => updateField('fuenteDatos', 'NUEVO')}
        >
          <PlusCircle size={14} color={state.fuenteDatos === 'NUEVO' ? '#FFF' : theme.textSecondary} />
          <Text style={[styles.sourceBtnText, { color: state.fuenteDatos === 'NUEVO' ? '#FFF' : theme.textSecondary }]}>Desde Cero</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sourceBtn, state.fuenteDatos === 'PLANTILLA' && { backgroundColor: theme.warning, borderColor: theme.warning }]}
          onPress={() => updateField('fuenteDatos', 'PLANTILLA')}
        >
          <Sparkles size={14} color={state.fuenteDatos === 'PLANTILLA' ? '#1A1A1A' : theme.textSecondary} />
          <Text style={[styles.sourceBtnText, { color: state.fuenteDatos === 'PLANTILLA' ? '#1A1A1A' : theme.textSecondary }]}>Datos Previos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sourceBtn, state.fuenteDatos === 'PATIO' && { backgroundColor: theme.success, borderColor: theme.success }]}
          onPress={() => updateField('fuenteDatos', 'PATIO')}
        >
          <PackageOpen size={14} color={state.fuenteDatos === 'PATIO' ? '#FFF' : theme.textSecondary} />
          <Text style={[styles.sourceBtnText, { color: state.fuenteDatos === 'PATIO' ? '#FFF' : theme.textSecondary }]}>Reserva Patio ({equiposPatio.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Vistas dinámicas según fuente de datos */}
      {state.fuenteDatos === 'PLANTILLA' && (
        <View style={[styles.sourceDataContainer, { backgroundColor: theme.cardAlt }]}>
          <Text style={[styles.sourceTitle, { color: theme.textSecondary }]}>Plantillas rápidas faena:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {plantillas.map(p => (
              <TouchableOpacity key={p.id} style={[styles.chip, { backgroundColor: theme.card }]} onPress={() => handleApplyPlantilla(p)}>
                <Text style={[styles.chipText, { color: theme.text }]}>{p.nombreCorto}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {state.fuenteDatos === 'PATIO' && (
        <View style={[styles.sourceDataContainer, { backgroundColor: theme.cardAlt }]}>
          <Text style={[styles.sourceTitle, { color: theme.textSecondary }]}>Equipos disponibles en patio:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {equiposPatio.map(e => (
              <TouchableOpacity key={e.id} style={[styles.chip, { backgroundColor: theme.card }]} onPress={() => handleApplyPatio(e)}>
                <Text style={[styles.chipText, { color: theme.text }]}>{e.codigo} ({e.marcaModelo})</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Formulario de Campos */}
      <View style={styles.formSection}>
        <View style={styles.row}>
          <View style={styles.fieldCol}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>CÓDIGO INTERNO / TAG *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.cardAlt, color: theme.text, borderColor: theme.border }]}
              value={state.codigo}
              onChangeText={(v) => updateField('codigo', v)}
              placeholder="Ej. CAEX-206"
              placeholderTextColor={theme.textTertiary}
            />
          </View>
          <View style={styles.fieldCol}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>PATENTE *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.cardAlt, color: theme.text, borderColor: theme.border }]}
              value={state.patente}
              onChangeText={(v) => updateField('patente', v)}
              placeholder="AA-BB-11"
              placeholderTextColor={theme.textTertiary}
            />
          </View>
        </View>

        <View style={styles.fieldFull}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>MODELO Y VERSIÓN DE MAQUINARIA *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.cardAlt, color: theme.text, borderColor: theme.border }]}
            value={state.marcaModelo}
            onChangeText={(v) => updateField('marcaModelo', v)}
            placeholder="Ej. Komatsu 930E-4"
            placeholderTextColor={theme.textTertiary}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.fieldCol}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>HORÓMETRO INICIAL *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.cardAlt, color: theme.text, borderColor: theme.border }]}
              value={state.horometro}
              onChangeText={(v) => updateField('horometro', v.replace(/[^0-9.]/g, ''))}
              keyboardType="numeric"
              placeholder="0.0"
              placeholderTextColor={theme.textTertiary}
            />
          </View>
          <View style={styles.fieldCol}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>COMBUSTIBLE (%)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.cardAlt, color: theme.text, borderColor: theme.border }]}
              value={state.combustible}
              onChangeText={(v) => updateField('combustible', v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              placeholder="100"
              maxLength={3}
              placeholderTextColor={theme.textTertiary}
            />
          </View>
        </View>

        <View style={styles.fieldFull}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>N° CHASIS / SERIE (VIN)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.cardAlt, color: theme.text, borderColor: theme.border }]}
            value={state.chasis}
            onChangeText={(v) => updateField('chasis', v)}
            placeholder="Opcional"
            placeholderTextColor={theme.textTertiary}
          />
        </View>

        <View style={styles.fieldFull}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>OPERADOR ASIGNADO A CABINA (EQUIPO #{equipoIdx + 1}):</Text>
          {/* Usamos un selector horizontal temporalmente o botones para el mock */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {MOCK_OPERADORES.map(op => (
              <TouchableOpacity
                key={op.id}
                style={[
                  styles.operatorChip,
                  { backgroundColor: theme.cardAlt, borderColor: theme.border },
                  state.operadorId === op.id && { backgroundColor: theme.primary + '20', borderColor: theme.primary }
                ]}
                onPress={() => updateField('operadorId', op.id)}
              >
                <Text style={[styles.operatorText, { color: state.operadorId === op.id ? theme.primary : theme.text }]}>
                  {op.nombre} ({op.rut})
                </Text>
                <Text style={[styles.operatorTurno, { color: theme.textSecondary }]}>{op.turno}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: theme.text }]}>Equipo Contratista / Arriendo</Text>
          <Switch
            value={state.contratista}
            onValueChange={(v) => updateField('contratista', v)}
            trackColor={{ false: theme.border, true: theme.primary + '80' }}
            thumbColor={state.contratista ? theme.primary : '#f4f3f4'}
          />
        </View>
      </View>
    </View>
  );
};
