import React, { useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme, ActivityIndicator } from 'react-native';
import { CheckCircle, MapPin } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { AppBottomSheetModal } from '../common/AppBottomSheetModal';
import { SearchableSelect } from '../common/SearchableSelect';
import { useAreasActivas } from '../../hooks/useAreasActivas';
import { useZonasPorArea } from '../../hooks/useZonasPorArea';
import { useAccionUnica } from '../../hooks/useAccionUnica';
import { vibrar } from '../../services/retroalimentacion';
import { Area, TurnoActual, ZonaTrabajo } from '../../types/turno';
import { styles } from './ChangeLocationModal.styles';

interface Props {
  visible: boolean;
  onClose: () => void;
  turno: TurnoActual | null;
  onConfirm: (area: Area, zona: ZonaTrabajo | null) => Promise<void>;
}

// Accesores estables para SearchableSelect (evitan recalcular la búsqueda en cada render)
const getId = (item: Area | ZonaTrabajo) => item.id;
const getNombre = (item: Area | ZonaTrabajo) => item.nombre;
const getDescripcion = (item: Area | ZonaTrabajo) => item.descripcion;

/**
 * Cambio de área o zona durante el turno, con la misma máquina (p. ej. lo reasignaron o volvió de
 * colación a otro frente). Desde ese momento las horas del turno se imputan a la nueva ubicación.
 */
export const ChangeLocationModal: React.FC<Props> = ({ visible, onClose, turno, onConfirm }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const { areas, isLoading: isLoadingAreas, error: areasError, refetch: refetchAreas } = useAreasActivas(visible);
  const [areaSeleccionada, setAreaSeleccionada] = useState<Area | null>(null);
  const [zonaSeleccionada, setZonaSeleccionada] = useState<ZonaTrabajo | null>(null);
  const { zonas, isLoading: isLoadingZonas, error: zonasError, refetch: refetchZonas } = useZonasPorArea(areaSeleccionada?.id ?? null);
  const [isSubmitting, ejecutarUnaVez] = useAccionUnica();
  const [submitError, setSubmitError] = useState('');

  // Al abrir parte con el área actual: lo habitual es cambiar solo de zona dentro de ella
  const [abierto, setAbierto] = useState(false);
  if (visible && !abierto) {
    setAbierto(true);
    setAreaSeleccionada(turno?.area ?? null);
    setZonaSeleccionada(null);
    setSubmitError('');
  }
  if (!visible && abierto) setAbierto(false);

  const mismaUbicacion =
    areaSeleccionada !== null &&
    areaSeleccionada.id === turno?.area?.id &&
    (zonaSeleccionada?.id ?? null) === (turno?.zona?.id ?? null);
  const canSubmit = areaSeleccionada !== null && !mismaUbicacion && !isSubmitting;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleConfirm = () => ejecutarUnaVez(async () => {
    if (!canSubmit || areaSeleccionada === null) return;
    setSubmitError('');
    try {
      await onConfirm(areaSeleccionada, zonaSeleccionada);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'No se pudo cambiar la ubicación.');
      vibrar('error');
    }
  });

  const footer = (
    <>
      <TouchableOpacity
        style={[styles.footerBtn, { borderColor: theme.border, backgroundColor: theme.background, opacity: isSubmitting ? 0.5 : 1 }]}
        onPress={handleClose}
        disabled={isSubmitting}
      >
        <Text style={[styles.footerBtnText, { color: theme.text }]}>Cancelar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.footerBtnConfirm, { backgroundColor: theme.primary, opacity: canSubmit ? 1 : 0.5 }]}
        onPress={handleConfirm}
        disabled={!canSubmit}
      >
        {isSubmitting
          ? <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
          : <CheckCircle size={20} color="#FFFFFF" style={{ marginRight: 8 }} />}
        <Text style={styles.footerBtnConfirmText}>CAMBIAR UBICACIÓN</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <AppBottomSheetModal
      // Hijo directo de la raíz de WorkzoneScreen: se dibuja como capa, sin abrir una ventana nativa
      superpuesto
      visible={visible}
      onClose={handleClose}
      title="Cambiar Área o Zona"
      subtitle="Usa esto si te asignaron a otro frente con la misma máquina. Si cambias de máquina, cierra el turno e inicia uno nuevo."
      icon={<MapPin size={22} color={theme.primary} />}
      iconBadgeColor={theme.primary + '15'}
      footer={footer}
    >
      <View style={[styles.actual, { borderColor: theme.border, backgroundColor: theme.background }]}>
        <MapPin size={20} color={theme.textTertiary} />
        <View style={styles.actualTextos}>
          <Text style={[styles.actualEtiqueta, { color: theme.textTertiary }]}>UBICACIÓN ACTUAL</Text>
          <Text style={[styles.actualNombre, { color: theme.text }]}>{turno?.area?.nombre ?? 'Sin área'}</Text>
          {turno?.zona && <Text style={[styles.actualZona, { color: theme.textSecondary }]}>{turno.zona.nombre}</Text>}
        </View>
      </View>

      <View style={styles.campo}>
        <SearchableSelect
          label="NUEVA ÁREA DE OPERACIÓN:"
          placeholder="Buscar o seleccionar área..."
          options={areas}
          value={areaSeleccionada}
          onChange={(area) => {
            setAreaSeleccionada(area);
            setZonaSeleccionada(null);
          }}
          getOptionKey={getId}
          getOptionLabel={getNombre}
          getOptionDescription={getDescripcion}
          isLoading={isLoadingAreas}
          error={areasError?.message}
          onRetry={refetchAreas}
          emptyMessage="No hay áreas activas registradas"
        />
      </View>
      <View style={styles.campo}>
        <SearchableSelect
          label="NUEVA ZONA DE TRABAJO (OPCIONAL):"
          placeholder={areaSeleccionada ? 'Buscar o seleccionar zona...' : 'Primero selecciona un área'}
          options={zonas}
          value={zonaSeleccionada}
          onChange={setZonaSeleccionada}
          getOptionKey={getId}
          getOptionLabel={getNombre}
          getOptionDescription={getDescripcion}
          isLoading={isLoadingZonas}
          error={zonasError?.message}
          onRetry={refetchZonas}
          disabled={!areaSeleccionada}
          hint={
            !isLoadingZonas && !zonasError && areaSeleccionada && zonas.length === 0
              ? 'Esta área no tiene zonas de trabajo registradas.'
              : undefined
          }
          emptyMessage="Esta área no tiene zonas de trabajo activas"
        />
      </View>

      {mismaUbicacion && (
        <Text style={[styles.ayuda, { color: theme.textSecondary }]}>Ya estás trabajando en esta área y zona: elige otra.</Text>
      )}
      {submitError !== '' && <Text style={[styles.errorText, { color: theme.dangerText }]}>{submitError}</Text>}
    </AppBottomSheetModal>
  );
};
