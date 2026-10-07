import React from 'react';
import { Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { SearchableSelect } from '../common/SearchableSelect';
import { styles } from './SelectorConCreacion.styles';

interface Props {
  label: string;
  labelNuevo: string;
  placeholder: string;
  placeholderNuevo: string;
  textoCrear: string;
  // Aviso bajo el campo de texto cuando el valor es nuevo
  hintNuevo: string;
  emptyMessage: string;
  opciones: string[];
  valor: string;
  onChange: (valor: string) => void;
  // Modo texto libre para ingresar un valor que no está en la lista; lo controla el formulario
  creando: boolean;
  onCreandoChange: (creando: boolean) => void;
  cargando?: boolean;
  error?: string | null;
  onReintentar?: () => void;
  maxLength?: number;
}

// Accesor estable para SearchableSelect (evita recalcular la búsqueda en cada render)
const comoTexto = (valor: string) => valor;

/**
 * Desplegable con búsqueda que al final ofrece crear una opción nueva: en ese caso el campo pasa a
 * texto libre. Si lo escrito ya existe con otras mayúsculas se avisa que se usará la opción existente.
 */
export const SelectorConCreacion: React.FC<Props> = ({
  label,
  labelNuevo,
  placeholder,
  placeholderNuevo,
  textoCrear,
  hintNuevo,
  emptyMessage,
  opciones,
  valor,
  onChange,
  creando,
  onCreandoChange,
  cargando,
  error,
  onReintentar,
  maxLength = 50,
}) => {
  const theme = useColorScheme() === 'dark' ? darkTheme : lightTheme;

  if (!creando) {
    return (
      <SearchableSelect
        label={label}
        placeholder={placeholder}
        options={opciones}
        value={valor || null}
        onChange={(opcion) => onChange(opcion ?? '')}
        getOptionKey={comoTexto}
        getOptionLabel={comoTexto}
        isLoading={cargando}
        error={error}
        onRetry={onReintentar}
        emptyMessage={emptyMessage}
        accionFinal={{
          label: textoCrear,
          // Lo que se estaba buscando se usa como punto de partida del valor nuevo
          onPress: (consulta) => {
            onChange(consulta);
            onCreandoChange(true);
          },
        }}
      />
    );
  }

  const existente = opciones.find((opcion) => opcion.toUpperCase() === valor.trim().toUpperCase());

  return (
    <View>
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{labelNuevo}</Text>
        <TouchableOpacity
          onPress={() => {
            onCreandoChange(false);
            onChange(existente ?? '');
          }}
          hitSlop={8}
        >
          <Text style={[styles.link, { color: theme.primary }]}>Elegir de la lista</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={[styles.input, { backgroundColor: theme.cardAlt, color: theme.text, borderColor: theme.primary }]}
        value={valor}
        onChangeText={onChange}
        placeholder={placeholderNuevo}
        placeholderTextColor={theme.textTertiary}
        maxLength={maxLength}
        autoFocus
      />
      <Text style={[styles.hint, { color: theme.textTertiary }]}>
        {existente ? `Ya existe: se usará «${existente}».` : hintNuevo}
      </Text>
    </View>
  );
};
