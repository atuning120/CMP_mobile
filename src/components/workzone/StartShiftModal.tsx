import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, useColorScheme, ActivityIndicator } from 'react-native';
import { CheckCircle, ClipboardCheck, UserCheck } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { AppBottomSheetModal } from '../common/AppBottomSheetModal';
import { SearchableSelect } from '../common/SearchableSelect';
import { FotoEvidenciaField } from '../common/FotoEvidenciaField';
import { FOTOS_HABILITADAS } from '../../constants/features';
import { useMaquinasActivas } from '../../hooks/useMaquinasActivas';
import { useAreasActivas } from '../../hooks/useAreasActivas';
import { useZonasPorArea } from '../../hooks/useZonasPorArea';
import { leerSesion } from '../../services/authStorage';
import { sincronizarCatalogos } from '../../sync/syncEngine';
import { Area, FotoCapturada, IniciarTurnoDatos, ZonaTrabajo } from '../../types/turno';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (datos: IniciarTurnoDatos) => Promise<void>;
}

// Accesores estables para SearchableSelect (evitan recalcular la búsqueda en cada render)
const getId = (item: Area | ZonaTrabajo) => item.id;
const getNombre = (item: Area | ZonaTrabajo) => item.nombre;
const getDescripcion = (item: Area | ZonaTrabajo) => item.descripcion;

export const StartShiftModal: React.FC<Props> = ({ visible, onClose, onConfirm }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const { maquinas, isLoading: isLoadingMaquinas, error: maquinasError, refetch: refetchMaquinas } = useMaquinasActivas(visible);
  const [selectedMaquina, setSelectedMaquina] = useState<number | null>(null);
  const [horometro, setHorometro] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [instrucciones, setInstrucciones] = useState('');
  const [foto, setFoto] = useState<FotoCapturada | null>(null);
  const { areas, isLoading: isLoadingAreas, error: areasError, refetch: refetchAreas } = useAreasActivas(visible);
  const [areaSeleccionada, setAreaSeleccionada] = useState<Area | null>(null);
  const [zonaSeleccionada, setZonaSeleccionada] = useState<ZonaTrabajo | null>(null);
  const { zonas, isLoading: isLoadingZonas, error: zonasError, refetch: refetchZonas } = useZonasPorArea(areaSeleccionada?.id ?? null);

  // La máquina que el jefe de turno le asignó al operador queda preseleccionada. Viene en el catálogo
  // guardado, así que funciona sin conexión; con conexión se refresca al abrir, porque la asignación
  // pudo cambiar hace minutos (el catálogo solo se renueva solo cada 30 min)
  const [idOperador, setIdOperador] = useState<number | null>(null);
  useEffect(() => {
    if (!visible) return;
    let cancelado = false;
    leerSesion().then((sesion) => {
      if (!cancelado) setIdOperador(sesion?.idOperador ?? null);
    });
    // Sin red falla y se queda con el catálogo guardado
    sincronizarCatalogos(true, ['maquina']).catch(() => undefined);
    return () => {
      cancelado = true;
    };
  }, [visible]);
  const maquinaAsignada = idOperador === null ? undefined : maquinas.find((m) => m.idOperadorAsignado === idOperador);
  // Se sigue la asignación mientras el operador no elija otra máquina a mano (el catálogo refrescado
  // puede traer una asignación distinta a la guardada)
  const [preseleccion, setPreseleccion] = useState<number | null>(null);
  if (visible && maquinaAsignada && maquinaAsignada.id !== preseleccion && (selectedMaquina === null || selectedMaquina === preseleccion)) {
    setPreseleccion(maquinaAsignada.id);
    setSelectedMaquina(maquinaAsignada.id);
  }
  if (!visible && preseleccion !== null) setPreseleccion(null);

  const handleHorometroChange = (text: string) => {
    let formattedText = text.replace(',', '.');
    formattedText = formattedText.replace(/[^0-9.]/g, '');
    const parts = formattedText.split('.');
    if (parts.length > 2) {
      formattedText = parts[0] + '.' + parts.slice(1).join('');
    }
    if (formattedText.includes('.')) {
      const [entero, decimal] = formattedText.split('.');
      formattedText = `${entero}.${decimal.slice(0, 1)}`;
    }
    const numericValue = parseFloat(formattedText);
    if (!isNaN(numericValue) && numericValue >= 1000000) {
      return;
    }
    setHorometro(formattedText);
  };

  const numericHorometro = parseFloat(horometro);
  const canSubmit =
    selectedMaquina !== null &&
    areaSeleccionada !== null &&
    !isNaN(numericHorometro) &&
    !isSubmitting;

  const handleClose = () => {
    if (isSubmitting) return;
    setSubmitError('');
    onClose();
  };

  const handleConfirm = async () => {
    const maquina = maquinas.find((m) => m.id === selectedMaquina);
    if (!canSubmit || !maquina || areaSeleccionada === null) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await onConfirm({
        maquina,
        horometroInicial: numericHorometro,
        area: areaSeleccionada,
        zona: zonaSeleccionada,
        instrucciones,
        foto,
      });
      setFoto(null);
      setSelectedMaquina(null);
      setAreaSeleccionada(null);
      setZonaSeleccionada(null);
      setHorometro('');
      setInstrucciones('');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'No se pudo iniciar el turno.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <>
      <TouchableOpacity style={[styles.footerBtn, { borderColor: theme.border, backgroundColor: theme.background }]} onPress={handleClose}>
        <Text style={[styles.footerBtnText, { color: theme.text }]}>Cancelar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.footerBtnConfirm, { backgroundColor: theme.success, opacity: canSubmit ? 1 : 0.5 }]}
        onPress={handleConfirm}
        disabled={!canSubmit}
      >
        {isSubmitting
          ? <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
          : <CheckCircle size={20} color="#FFFFFF" style={{ marginRight: 8 }} />}
        <Text style={[styles.footerBtnConfirmText, { color: '#FFFFFF' }]}>INICIAR TURNO</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <AppBottomSheetModal
      visible={visible}
      onClose={handleClose}
      title="Inicio de Turno"
      icon={<ClipboardCheck size={22} color={theme.success} />}
      iconBadgeColor={theme.success + '15'}
      footer={footer}
    >
      {/* Sección Maquinaria */}
      <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>SELECCIONAR MAQUINARIA ASIGNADA:</Text>
      {isLoadingMaquinas && <ActivityIndicator color={theme.primary} style={{ marginBottom: 20 }} />}
      {maquinasError && (
        <TouchableOpacity onPress={refetchMaquinas} style={{ marginBottom: 20 }}>
          <Text style={[styles.errorText, { color: theme.danger }]}>{maquinasError.message} Toca para reintentar.</Text>
        </TouchableOpacity>
      )}
      <View style={styles.gridContainer}>
        {maquinas.map((maq) => {
          const isSelected = selectedMaquina === maq.id;
          const esAsignada = maq.id === maquinaAsignada?.id;
          return (
            <TouchableOpacity
              key={maq.id}
              style={[
                styles.maquinaCard,
                {
                  backgroundColor: isSelected ? theme.primary + '20' : theme.cardAlt,
                  borderColor: isSelected ? theme.primary : theme.border,
                  borderWidth: isSelected ? 2 : 1,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isSelected ? 0 : 0.05,
                  shadowRadius: 4,
                  elevation: isSelected ? 0 : 1,
                }
              ]}
              onPress={() => setSelectedMaquina(maq.id)}
            >
              <View style={styles.maquinaCardTop}>
                <Text style={[styles.maquinaId, { color: theme.text }]}>{maq.codigoCorto}</Text>
                <Text style={[styles.maquinaTipo, { color: theme.warning }]}>{maq.tipoMaquina}</Text>
              </View>
              <Text style={[styles.maquinaModelo, { color: theme.textSecondary }]} numberOfLines={1}>{maq.modelo}</Text>
              {esAsignada && (
                <View style={styles.asignadaFila}>
                  <UserCheck size={12} color={theme.success} />
                  <Text style={[styles.asignadaTexto, { color: theme.success }]}>Tu máquina asignada</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Área y Zona */}
      <View style={{ marginBottom: 16 }}>
        <SearchableSelect
          label="ÁREA DE OPERACIÓN PRINCIPAL:"
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
      <View style={{ marginBottom: 24 }}>
        <SearchableSelect
          label="ZONA DE TRABAJO ESPECÍFICA (OPCIONAL):"
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
            !areaSeleccionada
              ? 'Las zonas se cargan según el área seleccionada.'
              : !isLoadingZonas && !zonasError && zonas.length === 0
                ? 'Esta área no tiene zonas de trabajo registradas.'
                : undefined
          }
          emptyMessage="Esta área no tiene zonas de trabajo activas"
        />
      </View>

      {/* Horómetro */}
      <View style={[styles.horometroContainer, { backgroundColor: theme.cardAlt, borderColor: theme.border, }]}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary, textAlign: 'center', marginBottom: 16 }]}>
          HORÓMETRO INICIAL EN CABINA
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.warning,
                backgroundColor: theme.background,
                borderColor: theme.border,
              }
            ]}
            value={horometro}
            onChangeText={handleHorometroChange}
            keyboardType="decimal-pad"
            placeholder="0.0"
            placeholderTextColor={theme.textTertiary}
          />
          <Text style={{ color: theme.textSecondary, fontSize: 18, fontWeight: '700' }}>hrs</Text>
        </View>
      </View>

      {/* Evidencias (desactivadas hasta integrar Cloudinary) */}
      {FOTOS_HABILITADAS && (
        <View>
          <Text style={[styles.sectionTitle, { color: theme.textTertiary, marginTop: 16 }]}>EVIDENCIA FOTOGRÁFICA DE PRE-USO (OPCIONAL):</Text>
          <FotoEvidenciaField
            foto={foto}
            onChange={setFoto}
            titulo="Adjuntar Foto de Evidencia"
            subtitulo="Toca aquí para abrir la cámara (Opcional)"
            disabled={isSubmitting}
          />
        </View>
      )}

      {/* Instrucciones */}
      <View>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary, marginTop: 16 }]}>INSTRUCCIONES / DESCRIPCIÓN DEL TRABAJO:</Text>
        <TextInput
        style={[styles.textArea, { backgroundColor: theme.cardAlt, borderColor: theme.border, color: theme.text }]}
        multiline
        scrollEnabled={false}
        maxLength={250}
        value={instrucciones}
        onChangeText={setInstrucciones}
        textAlignVertical="top"
        placeholder="Opcional: Añade observaciones adicionales aquí..."
        placeholderTextColor={theme.textTertiary}
      />
      <Text style={{ textAlign: 'right', fontSize: 10, color: theme.textTertiary, marginTop: 6, fontWeight: '500' }}>
        {instrucciones.length}/250
        </Text>
      </View>

      {submitError !== '' && (
        <Text style={[styles.errorText, { color: theme.danger, textAlign: 'center' }]}>{submitError}</Text>
      )}
    </AppBottomSheetModal>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 20,
  },
  maquinaCard: {
    width: '31%',
    minWidth: 150,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  maquinaCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  maquinaId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  maquinaTipo: {
    fontSize: 10,
    opacity: 0.8,
  },
  asignadaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  asignadaTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
  maquinaModelo: {
    fontSize: 12,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  horometroContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    paddingVertical: 24,
  },
  input: {
    flex: 0,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 12,
    width: 200,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
  },
  footerBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerBtnText: {
    fontWeight: 'bold',
  },
  footerBtnConfirm: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerBtnConfirmText: {
    fontWeight: 'bold',
    fontSize: 14,
  }
});
