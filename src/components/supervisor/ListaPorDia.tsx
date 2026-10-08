import React, { useMemo } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import type { ElementoPaginado, ListaPaginada } from '../../hooks/useListaPaginada';
import { agruparPorDia } from '../../utils/historialFechas';
import { styles } from './ListaPorDia.styles';

interface Props<T extends ElementoPaginado, P> {
  lista: ListaPaginada<T, P>;
  renderItem: (item: T) => React.ReactNode;
  // "eventos", "alertas": se usa en los mensajes de lista vacía y de fin
  nombre: string;
}

// Lista del jefe de turno agrupada por día ("Hoy", "Ayer", "Lunes 06/10"), con los estados de carga
// y el pie del scroll infinito (la pantalla llama a cargarMas al acercarse al final)
export function ListaPorDia<T extends ElementoPaginado, P>({ lista, renderItem, nombre }: Props<T, P>) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const dias = useMemo(() => agruparPorDia(lista.items), [lista.items]);

  if (lista.isLoading) return <ActivityIndicator size="large" color={theme.primary} style={styles.cargando} />;

  if (lista.error && lista.items.length === 0) {
    return (
      <View style={styles.errorCaja}>
        <Text style={[styles.centrado, { color: theme.danger }]}>{lista.error}</Text>
        <TouchableOpacity onPress={lista.refetch} style={[styles.reintentar, { backgroundColor: theme.primary }]}>
          <Text style={styles.reintentarTexto}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (lista.items.length === 0) {
    return <Text style={[styles.centrado, styles.vacio, { color: theme.textSecondary }]}>No hay {nombre} en este rango de fechas.</Text>;
  }

  return (
    <>
      {dias.map((dia) => (
        <View key={dia.clave}>
          <Text style={[styles.diaTitulo, { color: theme.textSecondary }]}>{dia.titulo}</Text>
          {dia.eventos.map((item) => (
            <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment>
          ))}
        </View>
      ))}
      {lista.isLoadingMas ? (
        <ActivityIndicator color={theme.primary} style={styles.finLista} />
      ) : lista.errorMas ? (
        <TouchableOpacity
          onPress={lista.cargarMas}
          style={[styles.cargarMas, { borderColor: theme.glassSurfaceBorder, backgroundColor: theme.glassSurface }]}
        >
          <Text style={[styles.cargarMasTexto, { color: theme.danger }]}>No se pudieron cargar más {nombre}. Reintentar</Text>
        </TouchableOpacity>
      ) : !lista.hayMas ? (
        <Text style={[styles.finLista, styles.finListaTexto, { color: theme.textTertiary }]}>No hay más {nombre} en este rango</Text>
      ) : null}
    </>
  );
}
