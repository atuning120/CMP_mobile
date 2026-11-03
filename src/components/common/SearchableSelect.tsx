import React, { useCallback, useDeferredValue, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Keyboard, useColorScheme, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Search, ChevronDown, ChevronUp, X, Check, SearchX, Plus } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { buscarEnIndice, crearIndiceBusqueda, RangoCoincidencia } from '../../utils/busqueda';
import { styles } from './SearchableSelect.styles';
import { useCapaDesplegable } from './CapaDesplegable';

// Separación entre el campo y la lista
const SEPARACION = 4;
// Opciones que se dibujan al abrir; el resto se agrega por tandas al acercarse al final de la lista. Con
// listas largas (operadores) abrir no cuesta más que con una corta, aun en teléfonos de gama baja
const TANDA_OPCIONES = 30;
// Distancia al final de la lista (px) a la que se dibuja la tanda siguiente
const UMBRAL_TANDA = 200;

// Ubicación de la lista flotante en coordenadas del contenido del modal; inicioCampo no es estilo
interface Posicion {
  left: number;
  width: number;
  top: number;
  inicioCampo: number;
}

const mismaPosicion = (a: Posicion | null, b: Posicion) =>
  !!a && a.left === b.left && a.width === b.width && a.top === b.top && a.inicioCampo === b.inicioCampo;

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
  const campoRef = useRef<View>(null);
  // Dentro de un modal la lista flota sobre los campos de abajo; fuera de él se despliega en línea
  const capa = useCapaDesplegable();
  const idCapa = useId();
  const [posicion, setPosicion] = useState<Posicion | null>(null);
  const [altoLista, setAltoLista] = useState(0);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  // Mientras el operador no escriba se muestran todas las opciones, aunque el campo tenga la selección actual
  const [isTyping, setIsTyping] = useState(false);

  const selectedLabel = value ? getOptionLabel(value) : '';
  const selectedKey = value ? getOptionKey(value) : null;

  // Los textos normalizados se calculan una vez por lista, no en cada tecla
  const indice = useMemo(() => crearIndiceBusqueda(options, getOptionLabel), [options, getOptionLabel]);
  // El campo muestra cada tecla al instante; la búsqueda y la lista se ponen al día cuando hay tiempo libre
  const consulta = useDeferredValue(isTyping ? query : '');
  const resultados = useMemo(() => buscarEnIndice(indice, consulta), [indice, consulta]);

  const [limite, setLimite] = useState(TANDA_OPCIONES);
  // Cada búsqueda nueva vuelve a la primera tanda (ajuste de estado durante el render, sin efecto extra)
  const [resultadosPrevios, setResultadosPrevios] = useState(resultados);
  if (resultadosPrevios !== resultados) {
    setResultadosPrevios(resultados);
    setLimite(TANDA_OPCIONES);
  }
  const visibles = resultados.length > limite ? resultados.slice(0, limite) : resultados;

  const alDesplazarOpciones = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (limite >= resultados.length) return;
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - UMBRAL_TANDA) {
      setLimite((actual) => actual + TANDA_OPCIONES);
    }
  };

  const abrir = () => {
    if (disabled) return;
    setQuery(selectedLabel);
    setIsTyping(false);
    setIsOpen(true);
  };

  const cerrar = () => {
    setIsOpen(false);
    setAltoLista(0);
    setLimite(TANDA_OPCIONES);
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

  const medir = useCallback(() => {
    if (!capa || !campoRef.current) return;
    capa.medir(campoRef.current, (x, y, ancho, alto) => {
      const nueva: Posicion = { left: x, width: ancho, top: y + alto + SEPARACION, inicioCampo: y };
      setPosicion((actual) => (mismaPosicion(actual, nueva) ? actual : nueva));
    });
  }, [capa]);

  // La lista va en el contenido desplazable: se mueve con el campo sin volver a medir. La posición se mide de
  // antemano (y al cambiar el alto del modal o del contenido) para que la lista aparezca en el mismo cuadro
  // en que se toca el campo; al abrir se confirma por si algo se movió
  useEffect(() => {
    if (!capa) return;
    medir();
    return capa.suscribir(medir);
  }, [capa, medir]);

  useEffect(() => {
    if (isOpen) medir();
  }, [isOpen, medir]);

  // Con la lista ya dibujada: alarga el contenido si se pasa del final y desplaza para que se vea completa
  useEffect(() => {
    if (!capa || !isOpen || !posicion || altoLista === 0) return;
    const finLista = posicion.top + altoLista;
    capa.reservar(idCapa, finLista);
    capa.asegurarVisible(posicion.inicioCampo, finLista);
  }, [capa, isOpen, posicion, altoLista, idCapa]);

  const borderColor = error && !isOpen ? theme.danger : isOpen ? theme.primary : theme.border;
  const Chevron = isOpen ? ChevronUp : ChevronDown;
  const consultaVisible = isTyping ? query.trim() : '';
  // Los textos de la lista siguen a la consulta ya buscada, no a la tecla recién escrita
  const consultaBuscada = consulta.trim();

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
          <Text style={[styles.stateText, { color: theme.dangerText }]}>{error}</Text>
          {onRetry && (
            <TouchableOpacity onPress={onRetry}>
              <Text style={[styles.retryText, { color: theme.primaryText }]}>Reintentar</Text>
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
            {consultaBuscada ? `Sin coincidencias para «${consultaBuscada}»` : emptyMessage}
          </Text>
        </View>
      );
    }
    return (
      <ScrollView
        style={styles.optionsScroll}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        onScroll={alDesplazarOpciones}
        scrollEventThrottle={100}
      >
        {visibles.map(({ item, rangos }, index) => {
          const key = getOptionKey(item);
          const isSelected = key === selectedKey;
          const descripcion = getOptionDescription?.(item);
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.option,
                index < visibles.length - 1 && [styles.optionBorder, { borderBottomColor: theme.border }],
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

  const desplegable = (
    <View
      style={[
        styles.dropdown,
        { backgroundColor: theme.card, borderColor: theme.border },
        capa && posicion && [styles.dropdownFlotante, { left: posicion.left, width: posicion.width, top: posicion.top }],
      ]}
      onLayout={capa ? (e) => setAltoLista(Math.round(e.nativeEvent.layout.height)) : undefined}
    >
      {!isLoading && !error && resultados.length > 0 && (
        <View style={[styles.dropdownHeader, { borderBottomColor: theme.border, backgroundColor: theme.cardAlt }]}>
          <Text style={[styles.dropdownHeaderText, { color: theme.textTertiary }]}>
            {consultaBuscada ? 'COINCIDENCIAS' : 'TODAS LAS OPCIONES'}
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
          <Text style={[styles.accionFinalTexto, { color: theme.primaryText }]}>{accionFinal.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // La lista flotante se dibuja en la capa del modal con lo último de este render
  useLayoutEffect(() => {
    if (!capa) return;
    if (isOpen && posicion) capa.mostrar(idCapa, desplegable);
    else capa.ocultar(idCapa);
  });
  useEffect(() => () => capa?.ocultar(idCapa), [capa, idCapa]);

  return (
    <View>
      <Text style={[styles.label, { color: theme.textTertiary }]}>{label}</Text>
      <View ref={campoRef} onLayout={isOpen ? medir : undefined}>
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
            // Android parte en dos líneas un placeholder más largo que el campo y la segunda queda cortada
            numberOfLines={1}
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

        {isOpen && !capa && desplegable}
      </View>
      {!!hint && (!isOpen || !!capa) && <Text style={[styles.hint, { color: theme.textTertiary }]}>{hint}</Text>}
    </View>
  );
}
