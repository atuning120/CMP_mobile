import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, useColorScheme, ActivityIndicator } from 'react-native';
import { TrendingUp, FileCheck, AlertTriangle } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { AppBottomSheetModal } from '../common/AppBottomSheetModal';
import { FinalizarTurnoDatos, FotoCapturada, TurnoActual } from '../../types/turno';
import { FotoEvidenciaField } from '../common/FotoEvidenciaField';
import { calcularDesgloseHoras, formatearHoras } from '../../utils/desgloseHoras';
import { FOTOS_HABILITADAS } from '../../constants/features';
import { useAccionUnica } from '../../hooks/useAccionUnica';
import { vibrar } from '../../services/retroalimentacion';
import { formatearHorometro, revisarHorometroFinal } from '../../utils/validacionHorometro';
import { mensajeDeError } from '../../utils/errores';

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
  // Bloquea toques repetidos en "CERRAR TURNO" mientras se guarda
  const [isSubmitting, ejecutarUnaVez] = useAccionUnica();
  const [submitError, setSubmitError] = useState('');
  // Segundo paso del cierre: el operador revisa el resumen antes de confirmar (no se puede deshacer)
  const [confirmando, setConfirmando] = useState(false);

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
    setConfirmando(false);
  };

  const numericHorometro = parseFloat(horometro);
  const revision = turno
    ? revisarHorometroFinal(horometro, turno.horometroInicial, turno.fechaInicio, ahora, (desglose?.efectivasMs ?? 0) / 3_600_000)
    : ({ tipo: 'vacio' } as const);
  const isHorometroValid = revision.tipo === 'ok';
  // El mensaje dice cuál es el mínimo, para que el operador no tenga que buscarlo arriba
  const horometroError =
    revision.tipo === 'menor' ? `No puede ser menor que el inicial (${formatearHorometro(revision.minimo)} hrs).` : '';
  const horometroExcesivo = revision.tipo === 'ok' && revision.excesivo;
  const horometroBajo = revision.tipo === 'ok' && revision.bajo;

  const canSubmit = isHorometroValid && horometro !== '' && !isSubmitting;

  const handleClose = () => {
    if (isSubmitting) return;
    setSubmitError('');
    setConfirmando(false);
    onClose();
  };

  const handleConfirm = () => ejecutarUnaVez(async () => {
    if (!canSubmit) return;
    setSubmitError('');
    try {
      await onConfirm({ horometroFinal: numericHorometro, novedades, foto });
      setHorometro('');
      setNovedades('');
      setFoto(null);
      setConfirmando(false);
    } catch (e) {
      setSubmitError(mensajeDeError(e, 'No se pudo cerrar el turno.'));
      vibrar('error');
    }
  });

  const botonCancelar = (texto: string, alPresionar: () => void) => (
    <TouchableOpacity
      style={[styles.footerBtn, { borderColor: theme.border, backgroundColor: theme.background, opacity: isSubmitting ? 0.5 : 1 }]}
      onPress={alPresionar}
      disabled={isSubmitting}
    >
      <Text style={[styles.footerBtnText, { color: theme.text }]}>{texto}</Text>
    </TouchableOpacity>
  );

  // Paso 1: completar el formulario. "CERRAR TURNO" no cierra todavía: muestra el resumen
  const footerFormulario = (
    <>
      {botonCancelar('Cancelar', handleClose)}
      <TouchableOpacity
        style={[styles.footerBtnConfirm, { backgroundColor: theme.danger, opacity: canSubmit ? 1 : 0.5 }]}
        onPress={() => setConfirmando(true)}
        disabled={!canSubmit}
      >
        <FileCheck size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={[styles.footerBtnConfirmText, { color: '#FFFFFF' }]}>CERRAR TURNO</Text>
      </TouchableOpacity>
    </>
  );

  // Paso 2: resumen de lo que se va a registrar y confirmación final
  const footerConfirmacion = revision.tipo === 'ok' && turno && (
    <View style={styles.confirmacion}>
      <Text style={[styles.confirmacionTitulo, { color: theme.text }]}>¿Confirmas el cierre del turno?</Text>
      <View
        style={[
          styles.resumen,
          { backgroundColor: theme.cardAlt, borderColor: horometroExcesivo ? theme.danger : horometroBajo ? theme.warning : theme.border },
        ]}
      >
        <View style={styles.resumenFila}>
          <Text style={[styles.resumenEtiqueta, { color: theme.textSecondary }]}>Máquina</Text>
          <Text style={[styles.resumenValor, { color: theme.text }]}>{turno.maquina.codigoCorto}</Text>
        </View>
        <View style={styles.resumenFila}>
          <Text style={[styles.resumenEtiqueta, { color: theme.textSecondary }]}>Horómetro</Text>
          <Text style={[styles.resumenValor, { color: theme.text }]}>
            {formatearHorometro(turno.horometroInicial)} → {formatearHorometro(numericHorometro)} hrs
          </Text>
        </View>
        <View style={styles.resumenFila}>
          <Text style={[styles.resumenEtiqueta, { color: theme.textSecondary }]}>Horas de uso</Text>
          <Text
            style={[styles.resumenValor, { color: horometroExcesivo ? theme.dangerText : horometroBajo ? theme.warningText : theme.text }]}
          >
            {formatearHorometro(revision.horasUso)} hrs
          </Text>
        </View>
        <View style={styles.resumenFila}>
          <Text style={[styles.resumenEtiqueta, { color: theme.textSecondary }]}>Duración del turno</Text>
          <Text style={[styles.resumenValor, { color: theme.text }]}>{formatearHorometro(revision.horasTurno)} hrs</Text>
        </View>
        <View style={styles.resumenFila}>
          <Text style={[styles.resumenEtiqueta, { color: theme.textSecondary }]}>Horas efectivas (según estados)</Text>
          <Text style={[styles.resumenValor, { color: theme.text }]}>{formatearHorometro(revision.horasEfectivas)} hrs</Text>
        </View>
        {horometroExcesivo && (
          <View style={styles.resumenAviso}>
            <AlertTriangle size={14} color={theme.danger} />
            <Text style={[styles.resumenAvisoTexto, { color: theme.dangerText }]}>
              Las horas de uso superan la duración del turno. Revisa el horómetro antes de confirmar.
            </Text>
          </View>
        )}
        {horometroBajo && (
          <View style={styles.resumenAviso}>
            <AlertTriangle size={14} color={theme.warning} />
            <Text style={[styles.resumenAvisoTexto, { color: theme.warningText }]}>
              Las horas de uso son menos que las horas efectivas del turno. Revisa el horómetro y que los estados estén al día.
            </Text>
          </View>
        )}
      </View>
      <View style={styles.confirmacionBotones}>
        {botonCancelar('Corregir', () => setConfirmando(false))}
        <TouchableOpacity
          style={[styles.footerBtnConfirm, { backgroundColor: theme.danger, opacity: isSubmitting ? 0.6 : 1 }]}
          onPress={handleConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
            : <FileCheck size={20} color="#FFFFFF" style={{ marginRight: 8 }} />}
          <Text style={[styles.footerBtnConfirmText, { color: '#FFFFFF' }]}>CONFIRMAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const footer = confirmando && footerConfirmacion ? footerConfirmacion : footerFormulario;

  if (!turno) return null;

  return (
    <AppBottomSheetModal
      // Hijo directo de la raíz de WorkzoneScreen: se dibuja como capa, sin abrir una ventana nativa
      superpuesto
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
          <Text style={[styles.datoValue, { color: theme.warningText }]}>{turno.id !== null ? `#${turno.id}` : 'Por sincronizar'}</Text>
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
          <Text style={[styles.datoValue, { color: theme.primaryText }]} numberOfLines={1}>{turno.area?.nombre ?? 'Sin asignar'}</Text>
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
                color: theme.warningText,
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
          <Text style={[styles.errorText, { color: theme.dangerText }]}>{horometroError}</Text>
        )}
        {horometroExcesivo && revision.tipo === 'ok' && (
          <Text style={[styles.errorText, { color: theme.warningText, textAlign: 'center' }]}>
            Equivale a {formatearHorometro(revision.horasUso)} hrs de uso, pero el turno lleva{' '}
            {formatearHorometro(revision.horasTurno)} hrs. Revisa que esté bien escrito.
          </Text>
        )}
        {horometroBajo && revision.tipo === 'ok' && (
          <Text style={[styles.errorText, { color: theme.warningText, textAlign: 'center' }]}>
            Equivale a {formatearHorometro(revision.horasUso)} hrs de uso, pero la máquina estuvo operando{' '}
            {formatearHorometro(revision.horasEfectivas)} hrs según los estados del turno. Revisa que esté bien escrito.
          </Text>
        )}
      </View>

      {/* Desglose de Horas */}
      <View style={[styles.desgloseContainer, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
        <View style={styles.desgloseHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} color={theme.primary} />
            <Text style={[styles.desgloseTitle, { color: theme.primaryText }]}>
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
            ayuda="Respaldo de la zona, el horómetro u otro detalle del cierre."
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
        <Text style={[styles.errorText, { color: theme.dangerText, textAlign: 'center' }]}>{submitError}</Text>
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
  },
  confirmacion: {
    flex: 1,
    gap: 12,
  },
  confirmacionTitulo: {
    fontSize: 15,
    fontWeight: '700',
  },
  resumen: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  resumenFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  resumenEtiqueta: {
    fontSize: 13,
  },
  resumenValor: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  resumenAviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
  },
  resumenAvisoTexto: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  confirmacionBotones: {
    flexDirection: 'row',
    gap: 12,
  },
});
