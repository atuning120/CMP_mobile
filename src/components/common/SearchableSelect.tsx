import React, { useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Keyboard, useColorScheme } from 'react-native';
import { Search, ChevronDown, ChevronUp, X, Check, SearchX, Plus } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { buscar, RangoCoincidencia } from '../../utils/busqueda';
import { styles } from './SearchableSelect.styles';

interface Props<T> {
  label: string;
  placeholder: string;
  options: T[];
  value: T | null;
  onChange: (option: T | null) => void;
  getOptionKey: (option: T) => string | number;
  getOptionLabel: (option: T) => string;
  getOptionDescription?: (option: T) => string | null | undefined;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  disabled?: boolean;
  // Texto de ayuda bajo el campo (p. ej. por qué está deshabilitado)
  hint?: string;
  emptyMessage?: string;
  // Acción fija al final de la lista (p. ej. crear una opción nueva); recibe lo que se estaba escribiendo
  accionFinal?: { label: string; onPress: (consulta: string) => void };
}

const TextoResaltado: React.FC<{ texto: string; rangos: RangoCoincidencia[]; color: string; colorResaltado: string; style: object }> = ({
  texto,
  rangos,
  color,
  colorResaltado,
  style,
}) => {
  if (rangos.length === 0) {
    return <Text style={[style, { color }]} numberOfLines={2}>{texto}</Text>;
  }
  const partes: React.ReactNode[] = [];
  let cursor = 0;
  rangos.forEach(([inicio, fin], i) => {
    if (inicio > cursor) partes.push(texto.slice(cursor, inicio));
    partes.push(
      <Text key={i} style={[styles.highlight, { color: colorResaltado }]}>
        {texto.slice(inicio, fin)}
      </Text>,
    );
    cursor = fin;
  });
  if (cursor < texto.length) partes.push(texto.slice(cursor));
  return <Text style={[style, { color }]} numberOfLines={2}>{partes}</Text>;
};

/**
 * Combobox: el mismo campo despliega las opciones y permite escribir para filtrarlas.
 * La búsqueda ignora acentos/mayúsculas, acepta palabras en cualquier orden y errores de tipeo leves.
 */
export function SearchableSelect<T>({
  label,
  placeholder,
  options,
  value,
  onChange,
  getOptionKey,
  getOptionLabel,
  getOptionDescription,
  isLoading = false,
  error = null,
  onRetry,
  disabled = false,
  hint,
  emptyMessage = 'No hay opciones disponibles',
  accionFinal,
}: Props<T>) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const inputRef = useRef<TextInput>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  // Mientras el operador no escriba se muestran todas las opciones, aunque el campo tenga la selección actual
  const [isTyping, setIsTyping] = useState(false);

  const selectedLabel = value ? getOptionLabel(value) : '';
  const selectedKey = value ? getOptionKey(value) : null;

  const resultados = useMemo(
    () => buscar(options, isTyping ? query : '', getOptionLabel),
    [options, isTyping, query, getOptionLabel],
  );

  const abrir = () => {
    if (disabled) return;
    setQuery(selectedLabel);
    setIsTyping(false);
    setIsOpen(true);
  };

  const cerrar = () => {
    setIsOpen(false);
    setIsTyping(false);
    setQuery('');
  };

  const seleccionar = (option: T) => {
    onChange(option);
    cerrar();
    inputRef.current?.blur();
    Keyboard.dismiss();
  };

  const limpiar = () => {
    onChange(null);
    setQuery('');
    setIsTyping(false);
  };

  const toggle = () => {
    if (disabled) return;
    if (isOpen) {
      inputRef.current?.blur();
      cerrar();
    } else {
      inputRef.current?.focus();
    }
  };

  const borderColor = error && !isOpen ? theme.danger : isOpen ? theme.primary : theme.border;
  const Chevron = isOpen ? ChevronUp : ChevronDown;
  const consultaVisible = isTyping ? query.trim() : '';

  const renderOpciones = () => {
    if (isLoading) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator color={theme.primary} />
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>Cargando...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.stateContainer}>
          <Text style={[styles.stateText, { color: theme.danger }]}>{error}</Text>
          {onRetry && (
            <TouchableOpacity onPress={onRetry}>
              <Text style={[styles.retryText, { color: theme.primary }]}>Reintentar</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    if (resultados.length === 0) {
      return (
        <View style={styles.stateContainer}>
          <SearchX size={22} color={theme.textTertiary} />
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>
            {consultaVisible ? `Sin coincidencias para «${consultaVisible}»` : emptyMessage}
          </Text>
        </View>
      );
    }
    return (
      <ScrollView style={styles.optionsScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
        {resultados.map(({ item, rangos }, index) => {
          const key = getOptionKey(item);
          const isSelected = key === selectedKey;
          const descripcion = getOptionDescription?.(item);
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.option,
                index < resultados.length - 1 && [styles.optionBorder, { borderBottomColor: theme.border }],
                isSelected && { backgroundColor: theme.primary + '15' },
              ]}
              onPress={() => seleccionar(item)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <View style={styles.optionTexts}>
                <TextoResaltado
                  texto={getOptionLabel(item)}
                  rangos={rangos}
                  color={isSelected ? theme.primary : theme.text}
                  colorResaltado={theme.primary}
                  style={styles.optionLabel}
                />
                {!!descripcion && (
                  <Text style={[styles.optionDescription, { color: theme.textTertiary }]} numberOfLines={1}>
                    {descripcion}
                  </Text>
                )}
              </View>
              {isSelected && <Check size={18} color={theme.primary} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <View>
      <Text style={[styles.label, { color: theme.textTertiary }]}>{label}</Text>
      <View>
        <TouchableOpacity
          activeOpacity={1}
          onPress={toggle}
          disabled={disabled}
          style={[styles.field, { backgroundColor: theme.cardAlt, borderColor, opacity: disabled ? 0.5 : 1 }]}
        >
          <Search size={18} color={isOpen ? theme.primary : theme.textTertiary} />
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: theme.text }]}
            value={isOpen ? query : selectedLabel}
            onChangeText={(text) => {
              setQuery(text);
              setIsTyping(true);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={abrir}
            onBlur={cerrar}
            onSubmitEditing={() => {
              if (resultados.length > 0) seleccionar(resultados[0].item);
            }}
            placeholder={placeholder}
            placeholderTextColor={theme.textTertiary}
            editable={!disabled}
            selectTextOnFocus
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityRole="combobox"
            accessibilityLabel={label}
            accessibilityState={{ expanded: isOpen, disabled }}
          />
          {(isOpen ? query.length > 0 : value !== null) && !disabled && (
            <TouchableOpacity onPress={limpiar} style={styles.iconButton} hitSlop={8} accessibilityLabel="Limpiar selección">
              <X size={18} color={theme.textTertiary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={toggle} disabled={disabled} style={styles.iconButton} hitSlop={8}>
            <Chevron size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </TouchableOpacity>

        {isOpen && (
          <View style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {!isLoading && !error && resultados.length > 0 && (
              <View style={[styles.dropdownHeader, { borderBottomColor: theme.border, backgroundColor: theme.cardAlt }]}>
                <Text style={[styles.dropdownHeaderText, { color: theme.textTertiary }]}>
                  {consultaVisible ? 'COINCIDENCIAS' : 'TODAS LAS OPCIONES'}
                </Text>
                <Text style={[styles.dropdownHeaderText, { color: theme.textTertiary }]}>
                  {resultados.length} de {options.length}
                </Text>
              </View>
            )}
            {renderOpciones()}
            {accionFinal && !isLoading && (
              <TouchableOpacity
                style={[styles.accionFinal, { borderTopColor: theme.border }]}
                onPress={() => {
                  const consulta = consultaVisible;
                  cerrar();
                  inputRef.current?.blur();
                  Keyboard.dismiss();
                  accionFinal.onPress(consulta);
                }}
                accessibilityRole="button"
              >
                <View style={[styles.accionFinalIcono, { backgroundColor: theme.primary + '18' }]}>
                  <Plus size={16} color={theme.primary} />
                </View>
                <Text style={[styles.accionFinalTexto, { color: theme.primary }]}>{accionFinal.label}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      {!!hint && !isOpen && <Text style={[styles.hint, { color: theme.textTertiary }]}>{hint}</Text>}
    </View>
  );
}
