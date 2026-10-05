import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, useColorScheme, useWindowDimensions } from 'react-native';
import { CheckCircle2, Clock, Info } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { AppBottomSheetModal } from '../common/AppBottomSheetModal';
import { EstadoOperacional, TurnoEstadoActual } from '../../types/turno';
import { CATEGORIAS, colorCategoria, IconoEstado, nombreCorto } from './estadoVisual';
import { EstadoInfoModal } from './EstadoInfoModal';
import { styles } from './ChangeStateModal.styles';

interface ChangeStateModalProps {
  visible: boolean;
  onClose: () => void;
  estadosCatalogo: EstadoOperacional[];
  estadoActual: TurnoEstadoActual | null;
  onStateChange: (estado: EstadoOperacional) => void;
}

const formatearDuracion = (inicioIso: string) => {
  const segundos = Math.max(0, Math.floor((Date.now() - new Date(inicioIso).getTime()) / 1000));
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return [h, m, s].map((n) => n.toString().padStart(2, '0')).join(':');
};

/**
 * Panel para cambiar el estado operacional: estados agrupados por categoría en una grilla
 * compacta; cada uno con un botón "i" que explica qué significa.
 */
export const ChangeStateModal: React.FC<ChangeStateModalProps> = ({
  visible,
  onClose,
  estadosCatalogo,
  estadoActual,
  onStateChange
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const { width } = useWindowDimensions();
  // Dos columnas en teléfono, tres en tablet
  const anchoTarjeta = width >= 700 ? '31.8%' : '48.5%';

  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [estadoInfo, setEstadoInfo] = useState<EstadoOperacional | null>(null);

  useEffect(() => {
    if (!visible || !estadoActual) return;
    const actualizar = () => setElapsedTime(formatearDuracion(estadoActual.inicio));
    actualizar();
    const interval = setInterval(actualizar, 1000);
    return () => clearInterval(interval);
  }, [visible, estadoActual]);

  const idActivo = estadoActual?.estado.id ?? null;

  const seleccionar = (estado: EstadoOperacional) => {
    setEstadoInfo(null);
    if (estado.id !== idActivo) onStateChange(estado);
  };

  const headerTop = (
    <Text style={[styles.headerTag, { color: theme.primary }]}>
      CONTROL TÁCTIL DE CABINA · FAENA MINERA
    </Text>
  );

  return (
    <AppBottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Cambiar Estado Operacional"
      subtitle="Toca el estado en que está el equipo. Usa la «i» para ver qué significa cada uno."
      headerTop={headerTop}
      scrollContentStyle={{ padding: 16 }}
    >
      {/* Estado vigente */}
      <View style={[styles.actual, { borderColor: theme.border, backgroundColor: theme.background }]}>
        <View style={styles.actualTextos}>
          <Text style={[styles.actualEtiqueta, { color: theme.textTertiary }]}>ESTADO ACTUAL</Text>
          <Text style={[styles.actualNombre, { color: estadoActual ? theme.text : theme.textSecondary }]} numberOfLines={1}>
            {estadoActual ? nombreCorto(estadoActual.estado) : 'Sin estado registrado'}
          </Text>
        </View>
        {estadoActual && (
          <View style={styles.actualTiempo}>
            <Clock size={14} color={theme.warning} />
            <Text style={[styles.actualTiempoTexto, { color: theme.warning }]}>{elapsedTime}</Text>
          </View>
        )}
      </View>

      {estadosCatalogo.length === 0 && (
        <Text style={[styles.vacio, { color: theme.textSecondary }]}>
          No hay estados guardados en el teléfono. Conéctate una vez para descargarlos.
        </Text>
      )}

      {CATEGORIAS.map(({ categoria, titulo, ayuda }) => {
        const estados = estadosCatalogo.filter((e) => e.categoria === categoria);
        if (estados.length === 0) return null;
        const color = colorCategoria(categoria, theme);

        return (
          <View key={categoria} style={styles.seccion}>
            <View style={styles.seccionEncabezado}>
              <View style={[styles.seccionPunto, { backgroundColor: color }]} />
              <Text style={[styles.seccionTitulo, { color: theme.text }]}>{titulo}</Text>
              <Text style={[styles.seccionConteo, { color: theme.textTertiary }]}>{estados.length}</Text>
            </View>
            <Text style={[styles.seccionAyuda, { color: theme.textTertiary }]}>{ayuda}</Text>

            <View style={styles.grilla}>
              {estados.map((estado) => {
                const activo = estado.id === idActivo;
                return (
                  <TouchableOpacity
                    key={estado.id}
                    style={[
                      styles.tarjeta,
                      { width: anchoTarjeta, backgroundColor: activo ? color + '18' : theme.cardAlt, borderColor: activo ? color : theme.border },
                      activo && styles.tarjetaActiva,
                    ]}
                    onPress={() => seleccionar(estado)}
                    disabled={activo}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activo }}
                    accessibilityLabel={nombreCorto(estado)}
                  >
                    <View style={styles.tarjetaArriba}>
                      <View style={[styles.icono, { backgroundColor: activo ? color : color + '18' }]}>
                        <IconoEstado estado={estado} size={18} color={activo ? '#FFFFFF' : color} />
                      </View>
                      <TouchableOpacity
                        style={[styles.botonInfo, { borderColor: theme.border, backgroundColor: theme.card }]}
                        onPress={() => setEstadoInfo(estado)}
                        hitSlop={8}
                        accessibilityLabel={`Información de ${nombreCorto(estado)}`}
                      >
                        <Info size={14} color={theme.textSecondary} />
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.tarjetaTitulo, { color: activo ? color : theme.text }]} numberOfLines={2}>
                      {nombreCorto(estado)}
                    </Text>
                    {!!estado.descripcion && (
                      <Text style={[styles.tarjetaDescripcion, { color: theme.textSecondary }]} numberOfLines={2}>
                        {estado.descripcion}
                      </Text>
                    )}

                    {activo && (
                      <View style={[styles.badgeActivo, { backgroundColor: color }]}>
                        <CheckCircle2 size={11} color="#FFFFFF" />
                        <Text style={styles.badgeActivoTexto}>ACTIVO</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}

      <EstadoInfoModal
        estado={estadoInfo}
        esActivo={estadoInfo?.id === idActivo}
        onClose={() => setEstadoInfo(null)}
        onSeleccionar={seleccionar}
      />
    </AppBottomSheetModal>
  );
};
