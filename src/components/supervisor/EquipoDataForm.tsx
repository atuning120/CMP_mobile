import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, useColorScheme, Switch, ActivityIndicator } from 'react-native';
import { Sparkles, PlusCircle, Copy, Zap } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { styles } from './EquipoDataForm.styles';
import { SearchableSelect } from '../common/SearchableSelect';

export type FuenteDatos = 'NUEVO' | 'PLANTILLA';

export interface EquipoFormState {
  codigo: string;
  patente: string;
  marca: string;
  modelo: string;
  tipoMaquina: string;
  anio: string;
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
  marca: string;
  modelo: string;
  tipoMaquina: string;
}

export const EQUIPO_FORM_INICIAL: EquipoFormState = {
  codigo: '',
  patente: '',
  marca: '',
  modelo: '',
  tipoMaquina: '',
  anio: '',
  horometro: '',
  combustible: '',
  chasis: '',
  operadorId: '',
  contratista: false,
  fuenteDatos: 'NUEVO',
};


interface Props {
  equipoIdx: number;
  state: EquipoFormState;
  onChange: (newState: EquipoFormState) => void;
  plantillas: PlantillaEquipo[];
  cargandoPlantillas?: boolean;
  errorPlantillas?: string | null;
  tiposMaquina: string[];
  cargandoTipos?: boolean;
  errorTipos?: string | null;
  onReintentarTipos?: () => void;
}

// Accesores estables para SearchableSelect (evitan recalcular la búsqueda en cada render)
const tipoComoTexto = (tipo: string) => tipo;


export const EquipoDataForm: React.FC<Props> = ({
  equipoIdx,
  state,
  onChange,
  plantillas,
  cargandoPlantillas,
  errorPlantillas,
  tiposMaquina,
  cargandoTipos,
  errorTipos,
  onReintentarTipos,
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const updateField = (field: keyof EquipoFormState, value: any) => {
    onChange({ ...state, [field]: value });
  };

  const handleApplyPlantilla = (plantilla: PlantillaEquipo) => {
    onChange({
      ...state,
      marca: plantilla.marca,
      modelo: plantilla.modelo,
      tipoMaquina: plantilla.tipoMaquina,
      // El horómetro es propio de cada máquina: la plantilla no lo toca
      fuenteDatos: 'PLANTILLA',
    });
  };


  return (
    <View style={styles.container}>
      {/* Fuente de Datos Selector */}
      <View style={styles.sourceSelectorRow}>
        <TouchableOpacity
          style={[
            styles.sourceBtn,
            { backgroundColor: theme.cardAlt, borderColor: theme.border },
            state.fuenteDatos === 'NUEVO' && { backgroundColor: theme.primary + '10', borderColor: theme.primary }
          ]}
          onPress={() => updateField('fuenteDatos', 'NUEVO')}
        >
          <PlusCircle size={20} color={state.fuenteDatos === 'NUEVO' ? theme.primary : theme.textSecondary} />
          <Text style={[styles.sourceBtnText, { color: state.fuenteDatos === 'NUEVO' ? theme.primary : theme.textSecondary }]}>Desde Cero</Text>
          <Text style={[styles.sourceBtnSubtitle, { color: state.fuenteDatos === 'NUEVO' ? theme.primary : theme.textTertiary }]}>
            (Formulario Limpio)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sourceBtn,
            { backgroundColor: theme.cardAlt, borderColor: theme.border },
            state.fuenteDatos === 'PLANTILLA' && { backgroundColor: theme.primary + '10', borderColor: theme.primary }
          ]}
          onPress={() => updateField('fuenteDatos', 'PLANTILLA')}
        >
          <Sparkles size={20} color={state.fuenteDatos === 'PLANTILLA' ? theme.primary : theme.textSecondary} />
          <Text style={[styles.sourceBtnText, { color: state.fuenteDatos === 'PLANTILLA' ? theme.primary : theme.textSecondary }]}>Datos Previos</Text>
          <Text style={[styles.sourceBtnSubtitle, { color: state.fuenteDatos === 'PLANTILLA' ? theme.primary : theme.textTertiary }]}>
            (Solo Modificar)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Vistas dinámicas según fuente de datos */}
      {state.fuenteDatos === 'PLANTILLA' && (
        <View style={[styles.sourceDataContainer, { backgroundColor: theme.cardAlt, borderWidth: 1, borderColor: theme.border }]}>
          <View style={styles.plantillaHeaderRow}>
            <View style={styles.plantillaHeaderTitleRow}>
              <Copy size={16} color={theme.primary} />
              <Text style={[styles.sourceTitle, { color: theme.textSecondary, marginBottom: 0 }]}>
                Modelos registrados (1 toque para rellenar marca, modelo y tipo):
              </Text>
            </View>
          </View>

          {cargandoPlantillas ? (
            <ActivityIndicator color={theme.primary} style={styles.plantillasEstado} />
          ) : errorPlantillas ? (
            <Text style={[styles.plantillasMensaje, { color: theme.danger }]}>{errorPlantillas}</Text>
          ) : plantillas.length === 0 ? (
            <Text style={[styles.plantillasMensaje, { color: theme.textSecondary }]}>Aún no hay modelos registrados.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
              {plantillas.map(p => {
                // Se marca el modelo que está aplicado en el formulario
                const aplicada = state.marca === p.marca && state.modelo === p.modelo && state.tipoMaquina === p.tipoMaquina;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.plantillaChip,
                      { backgroundColor: theme.card, borderColor: 'transparent' },
                      aplicada && { backgroundColor: theme.primary + '18', borderColor: theme.primary },
                    ]}
                    onPress={() => handleApplyPlantilla(p)}
                  >
                    <Zap size={14} color={theme.primary} />
                    <View>
                      <Text style={[styles.chipText, { color: aplicada ? theme.primary : theme.text }]}>{p.nombreCorto}</Text>
                      <Text style={[styles.chipSubtext, { color: theme.textSecondary }]}>{p.tipoMaquina}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
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
              autoCapitalize="characters"
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
              autoCapitalize="characters"
              placeholder="AA-BB-11"
              placeholderTextColor={theme.textTertiary}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.fieldCol}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>MARCA *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.cardAlt, color: theme.text, borderColor: theme.border }]}
              value={state.marca}
              onChangeText={(v) => updateField('marca', v)}
              placeholder="Ej. Komatsu"
              placeholderTextColor={theme.textTertiary}
            />
          </View>
          <View style={styles.fieldCol}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>MODELO Y VERSIÓN *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.cardAlt, color: theme.text, borderColor: theme.border }]}
              value={state.modelo}
              onChangeText={(v) => updateField('modelo', v)}
              placeholder="Ej. 930E-4"
              placeholderTextColor={theme.textTertiary}
            />
          </View>
        </View>

        <View style={styles.fieldFull}>
          <SearchableSelect
            label="TIPO DE MÁQUINA *"
            placeholder="Buscar o seleccionar tipo..."
            options={tiposMaquina}
            value={state.tipoMaquina || null}
            onChange={(tipo) => updateField('tipoMaquina', tipo ?? '')}
            getOptionKey={tipoComoTexto}
            getOptionLabel={tipoComoTexto}
            isLoading={cargandoTipos}
            error={errorTipos}
            onRetry={onReintentarTipos}
            emptyMessage="Aún no hay tipos de máquina registrados"
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
            <Text style={[styles.label, { color: theme.textSecondary }]}>AÑO DE FABRICACIÓN</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.cardAlt, color: theme.text, borderColor: theme.border }]}
              value={state.anio}
              onChangeText={(v) => updateField('anio', v.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="number-pad"
              placeholder="Opcional"
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

        {/* <View style={styles.fieldFull}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>OPERADOR ASIGNADO A CABINA (EQUIPO #{equipoIdx + 1}):</Text>
          {/* Usamos un selector horizontal temporalmente o botones para el mock 
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
        </View> */}

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
