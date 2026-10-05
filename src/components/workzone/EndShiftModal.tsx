import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, useColorScheme, ActivityIndicator } from 'react-native';
import { Camera, TrendingUp, FileCheck } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { AppBottomSheetModal } from '../common/AppBottomSheetModal';
import { TurnoActual } from '../../types/turno';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (horometroFinal: number) => Promise<void>;
  turno: TurnoActual | null;
}

export const EndShiftModal: React.FC<Props> = ({ visible, onClose, onConfirm, turno }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const [horometro, setHorometro] = useState('');
  const [novedades, setNovedades] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Cálculos de horas
  const desglose = useMemo(() => {
    let efectivasMs = 0;
    let demorasMs = 0;
    const now = new Date();

    if (turno?.historialEstados) {
      turno.historialEstados.forEach(h => {
        const start = new Date(h.inicio).getTime();
        const end = h.fin ? new Date(h.fin).getTime() : now.getTime();
        const durationMs = end - start;

        if (h.estado.categoria === 'PRODUCTIVO') {
          efectivasMs += durationMs;
        } else if (h.estado.categoria === 'DEMORA') {
          demorasMs += durationMs;
        }
      });
    }

    const totalTurnoMs = turno ? (now.getTime() - new Date(turno.fechaInicio).getTime()) : 0;
    const totalTurnoHrs = (totalTurnoMs / (1000 * 60 * 60)).toFixed(1);
    const efectivasHrs = (efectivasMs / (1000 * 60 * 60)).toFixed(1);
    const pausasHrs = (demorasMs / (1000 * 60 * 60)).toFixed(1);

    return { totalTurnoHrs, efectivasHrs, pausasHrs, ralentiHrs: '0.0' }; // ralentiHrs is TODO
  }, [turno]);

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
  const isHorometroValid = !isNaN(numericHorometro) && (turno ? numericHorometro >= turno.horometroInicial : true);
  const horometroError = (!isHorometroValid && horometro !== '') ? 'El horómetro final debe ser mayor o igual al inicial.' : '';

  const canSubmit = isHorometroValid && horometro !== '' && !isSubmitting;

  const handleClose = () => {
    if (isSubmitting) return;
    setSubmitError('');
    onClose();
  };

  // TODO: las novedades aún no se envían al Backend (REPORTE_TURNO tipo FIN)
  const handleConfirm = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await onConfirm(numericHorometro);
      setHorometro('');
      setNovedades('');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'No se pudo cerrar el turno.');
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
        style={[styles.footerBtnConfirm, { backgroundColor: theme.danger, opacity: canSubmit ? 1 : 0.5 }]}
        onPress={handleConfirm}
        disabled={!canSubmit}
      >
        {isSubmitting
          ? <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
          : <FileCheck size={20} color="#FFFFFF" style={{ marginRight: 8 }} />}
        <Text style={[styles.footerBtnConfirmText, { color: '#FFFFFF' }]}>CERRAR TURNO</Text>
      </TouchableOpacity>
    </>
  );

  if (!turno) return null;

  return (
    <AppBottomSheetModal
      visible={visible}
      onClose={handleClose}
      title="Cierre de Turno y Conciliación"
      icon={<FileCheck size={22} color={theme.danger} />}
      iconBadgeColor={theme.danger + '15'}
      footer={footer}
      scrollContentStyle={{ padding: 16 }}
    >
      {/* Datos del turno */}
      <View style={[styles.datosGrid, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
        <View style={styles.datoCol}>
          <Text style={[styles.datoLabel, { color: theme.textSecondary }]}>TURNO:</Text>
          <Text style={[styles.datoValue, { color: theme.warning }]}>#{turno.id}</Text>
        </View>
        <View style={styles.datoCol}>
          <Text style={[styles.datoLabel, { color: theme.textSecondary }]}>MÁQUINA:</Text>
          <Text style={[styles.datoValue, { color: theme.text }]}>{turno.maquina.codigoCorto}</Text>
        </View>
        <View style={styles.datoCol}>
          <Text style={[styles.datoLabel, { color: theme.textSecondary }]}>HORÓM. INICIAL:</Text>
          <Text style={[styles.datoValue, { color: theme.text }]}>{turno.horometroInicial} hrs</Text>
        </View>
        <View style={styles.datoCol}>
          <Text style={[styles.datoLabel, { color: theme.textSecondary }]}>ÁREA:</Text>
          <Text style={[styles.datoValue, { color: theme.primary }]} numberOfLines={1}>{turno.area?.nombre ?? 'Sin asignar'}</Text>
        </View>
      </View>

      {/* Horómetro Final */}
      <View style={[styles.horometroContainer, { backgroundColor: theme.cardAlt, borderColor: theme.border, alignItems: 'center' }]}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary, textAlign: 'center', marginBottom: 16 }]}>
          HORÓMETRO FINAL REGISTRADO
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.warning,
                backgroundColor: theme.background,
                borderColor: (!isHorometroValid && horometro !== '') ? theme.danger : theme.border,
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
        {horometroError !== '' && (
          <Text style={[styles.errorText, { color: theme.danger }]}>{horometroError}</Text>
        )}
      </View>

      {/* Desglose de Horas */}
      <View style={[styles.desgloseContainer, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
        <View style={styles.desgloseHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} color={theme.primary} />
            <Text style={[styles.desgloseTitle, { color: theme.primary }]}>
              Desglose Automatizado de Horas
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.background }]}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>TOTAL TURNO</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{desglose.totalTurnoHrs} hrs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.success }]}>
            <Text style={[styles.statLabel, { color: '#FFFFFF', opacity: 0.8 }]}>HORAS EFECTIVAS</Text>
            <Text style={[styles.statValue, { color: '#FFFFFF' }]}>{desglose.efectivasHrs} hrs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.warning }]}>
            <Text style={[styles.statLabel, { color: '#FFFFFF', opacity: 0.8 }]}>PAUSAS / COLACIÓN</Text>
            <Text style={[styles.statValue, { color: '#FFFFFF' }]}>{desglose.pausasHrs} hrs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.danger }]}>
            <Text style={[styles.statLabel, { color: '#FFFFFF', opacity: 0.8 }]}>RALENTÍ DESCONTADO</Text>
            <Text style={[styles.statValue, { color: '#FFFFFF' }]}>{desglose.ralentiHrs} hrs</Text>
          </View>
        </View>
      </View>

      {/* Evidencias */}
      <Text style={[styles.sectionTitle, { color: theme.textTertiary, marginTop: 16 }]}>FOTO DE RESPALDO FINAL:</Text>
      <TouchableOpacity style={[styles.evidenciaBtn, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
        <View style={[styles.evidenciaIconBadge, { backgroundColor: theme.primary + '15' }]}>
          <Camera size={26} color={theme.primary} />
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.evidenciaTitle, { color: theme.text }]}>Adjuntar Foto</Text>
          <Text style={[styles.evidenciaSub, { color: theme.textSecondary }]}>Respaldo de la zona o el horometro, etc...</Text>
        </View>
      </TouchableOpacity>

      {/* Novedades */}
      <Text style={[styles.sectionTitle, { color: theme.textTertiary, marginTop: 16 }]}>NOVEDADES PARA EL TRASPASO DE TURNO EN TERRENO:</Text>
      <TextInput
        style={[styles.textArea, { backgroundColor: theme.cardAlt, borderColor: theme.border, color: theme.text }]}
        multiline
        scrollEnabled={false}
        maxLength={500}
        value={novedades}
        onChangeText={setNovedades}
        textAlignVertical="top"
        placeholder="Turno finalizado sin novedades mecánicas..."
        placeholderTextColor={theme.textTertiary}
      />

      {submitError !== '' && (
        <Text style={[styles.errorText, { color: theme.danger, textAlign: 'center' }]}>{submitError}</Text>
      )}
    </AppBottomSheetModal>
  );
};

const styles = StyleSheet.create({
  headerTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  datosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  datoCol: {
    width: '46%',
  },
  datoLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  datoValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  horometroContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
  errorText: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  desgloseContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  desgloseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  desgloseTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  desgloseFooter: {
    fontSize: 11,
    textAlign: 'center',
  },
  evidenciaBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderStyle: 'dashed',
    gap: 12,
    marginBottom: 8,
  },
  evidenciaIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  evidenciaTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  evidenciaSub: {
    fontSize: 12,
    textAlign: 'center',
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
