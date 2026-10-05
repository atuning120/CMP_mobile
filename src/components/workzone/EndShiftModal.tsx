import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, useColorScheme, ActivityIndicator } from 'react-native';
import { TrendingUp, FileCheck } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { AppBottomSheetModal } from '../common/AppBottomSheetModal';
import { FinalizarTurnoDatos, FotoCapturada, TurnoActual } from '../../types/turno';
import { FotoEvidenciaField } from '../common/FotoEvidenciaField';
import { calcularDesgloseHoras, formatearHoras } from '../../utils/desgloseHoras';
import { FOTOS_HABILITADAS } from '../../constants/features';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (datos: FinalizarTurnoDatos) => Promise<void>;
  turno: TurnoActual | null;
}

export const EndShiftModal: React.FC<Props> = ({ visible, onClose, onConfirm, turno }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const [horometro, setHorometro] = useState('');
  const [novedades, setNovedades] = useState('');
  const [foto, setFoto] = useState<FotoCapturada | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // El desglose se recalcula cada 30 s mientras el modal está abierto (el estado vigente sigue sumando)
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    if (!visible) return;
    const actualizar = () => setAhora(new Date());
    const primera = setTimeout(actualizar, 0);
    const intervalo = setInterval(actualizar, 30_000);
    return () => {
      clearTimeout(primera);
      clearInterval(intervalo);
    };
  }, [visible]);

  const desglose = useMemo(
    () => (turno ? calcularDesgloseHoras(turno.fechaInicio, turno.historialEstados, ahora) : null),
    [turno, ahora],
  );

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

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await onConfirm({ horometroFinal: numericHorometro, novedades, foto });
      setHorometro('');
      setNovedades('');
      setFoto(null);
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
          <Text style={[styles.datoValue, { color: theme.warning }]}>{turno.id !== null ? `#${turno.id}` : 'Por sincronizar'}</Text>
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

        {desglose && (
          <>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.statCardAncho, { backgroundColor: theme.background }]}>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>TOTAL TURNO</Text>
                <Text style={[styles.statValue, { color: theme.text }]}>{formatearHoras(desglose.totalMs)}</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.success }]}>
                <Text style={[styles.statLabel, { color: '#FFFFFF', opacity: 0.8 }]}>HORAS EFECTIVAS</Text>
                <Text style={[styles.statValue, { color: '#FFFFFF' }]}>{formatearHoras(desglose.efectivasMs)}</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.warning }]}>
                <Text style={[styles.statLabel, { color: '#FFFFFF', opacity: 0.8 }]}>DEMORAS OPERACIONALES</Text>
                <Text style={[styles.statValue, { color: '#FFFFFF' }]}>{formatearHoras(desglose.demorasMs)}</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.danger }]}>
                <Text style={[styles.statLabel, { color: '#FFFFFF', opacity: 0.8 }]}>MANTENCIÓN Y FALLAS</Text>
                <Text style={[styles.statValue, { color: '#FFFFFF' }]}>{formatearHoras(desglose.mantencionMs)}</Text>
              </View>
              {/* El ralentí requiere la telemetría GPS del equipo, que la app aún no integra */}
              <View style={[styles.statCard, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed' }]}>
                <Text style={[styles.statLabel, { color: theme.textTertiary }]}>RALENTÍ</Text>
                <Text style={[styles.statNoDisponible, { color: theme.textTertiary }]}>No disponible</Text>
                <Text style={[styles.statNota, { color: theme.textTertiary }]}>Requiere telemetría GPS</Text>
              </View>
            </View>

            {desglose.sinEstadoMs >= 60_000 && (
              <Text style={[styles.sinEstado, { color: theme.textSecondary }]}>
                Sin estado registrado: <Text style={{ fontWeight: 'bold' }}>{formatearHoras(desglose.sinEstadoMs)}</Text>
                {'  '}(tiempo del turno antes de elegir un estado operacional)
              </Text>
            )}
          </>
        )}
      </View>

      {/* Evidencias */}
      {FOTOS_HABILITADAS && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.textTertiary, marginTop: 16 }]}>FOTO DE RESPALDO FINAL:</Text>
          <FotoEvidenciaField
            foto={foto}
            onChange={setFoto}
            titulo="Adjuntar Foto"
            subtitulo="Respaldo de la zona o el horometro, etc..."
            disabled={isSubmitting}
          />
        </>
      )}

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
  statCardAncho: {
    width: '100%',
  },
  statNoDisponible: {
    fontSize: 14,
    fontWeight: '700',
  },
  statNota: {
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  sinEstado: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: -4,
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
