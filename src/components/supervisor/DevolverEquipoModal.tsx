import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { AlertTriangle, CheckCircle, Undo2 } from 'lucide-react-native';
import { AppBottomSheetModal } from '../common/AppBottomSheetModal';
import { SearchableSelect } from '../common/SearchableSelect';
import { darkTheme, lightTheme } from '../../constants/theme';
import { MOTIVOS_DEVOLUCION } from '../../constants/motivosJefeTurno';
import { presentacionEstado } from '../../constants/estadosMaquina';
import { MaquinaFlota, mapMaquinaFlota } from '../../hooks/useFlotaResumen';
import { cerrarTurnoDeMaquina, devolverMaquina, listarFlota } from '../../services/flotaService';
import { CierreTurnoCampos, leerHorometro } from './CierreTurnoCampos';
import { styles } from './CambiarEstadoModal.styles';
import { useAccionUnica } from '../../hooks/useAccionUnica';
import { mostrarAviso } from '../../services/retroalimentacion';
import { mensajeDeError } from '../../utils/errores';
import { useVersionBase } from '../../hooks/useVersionBase';

interface Props {
  // Máquina original que vuelve de la reparación; null = modal cerrado
  maquina: MaquinaFlota | null;
  onClose: () => void;
  // El Backend registró la devolución: hay que refrescar la flota y el historial
  onDevuelto: () => void;
}

const comoTexto = (valor: string) => valor;

/**
 * Deshace un reemplazo: la original vuelve a operar con el operador de su respaldo y el respaldo vuelve al estado que
 * tenía (normalmente en reserva). Si el respaldo tiene un turno en curso, primero se cierra con su horómetro final.
 */
export const DevolverEquipoModal: React.FC<Props> = ({ maquina, onClose, onDevuelto }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const visible = maquina !== null;
  const [motivo, setMotivo] = useState('');
  const [observacion, setObservacion] = useState('');
  const [horometroCierre, setHorometroCierre] = useState('');
  const [turnoCerrado, setTurnoCerrado] = useState(false);
  const [guardando, ejecutarUnaVez] = useAccionUnica();
  const [error, setError] = useState<string | null>(null);

  // El respaldo con sus datos al día (quién lo opera ahora); puede no estar en la lista filtrada de la pantalla
  const [respaldo, setRespaldo] = useState<MaquinaFlota | null>(null);
  const { versionBase, explicarError } = useVersionBase(maquina);
  const [cargando, setCargando] = useState(false);
  useEffect(() => {
    if (!maquina?.respaldo) return;
    let cancelado = false;
    const idRespaldo = maquina.respaldo.id;
    const timer = setTimeout(async () => {
      setCargando(true);
      try {
        const encontrada = (await listarFlota('')).find((m) => m.idMaquina === idRespaldo);
        if (!cancelado) setRespaldo(encontrada ? mapMaquinaFlota(encontrada) : null);
      } catch (err) {
        if (!cancelado) setError(mensajeDeError(err, 'No se pudo cargar el respaldo.'));
      } finally {
        if (!cancelado) setCargando(false);
      }
    }, 0);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [maquina]);

  // Cada apertura parte en blanco
  const [abiertaPara, setAbiertaPara] = useState<MaquinaFlota | null>(null);
  if (maquina !== abiertaPara) {
    setAbiertaPara(maquina);
    setMotivo('');
    setObservacion('');
    setHorometroCierre('');
    setTurnoCerrado(false);
    setRespaldo(null);
    setError(null);
  }

  if (!maquina?.respaldo) return null;

  const pideCierre = !!respaldo?.operadorEnTurno && !turnoCerrado;
  const horometro = leerHorometro(horometroCierre);
  const cierreListo = !pideCierre || (horometro !== null && horometro >= (respaldo?.horometroActual ?? 0));
  const listo = respaldo !== null && motivo !== '' && cierreListo && !guardando;
  const estadoRespaldo = presentacionEstado(maquina.respaldo.estadoAlDevolver).etiqueta.toLowerCase();

  const cerrar = () => {
    if (!guardando) onClose();
  };

  const confirmar = () => ejecutarUnaVez(async () => {
    if (!respaldo) return;
    setError(null);
    let cerroTurno = false;
    try {
      if (pideCierre && horometro !== null) {
        await cerrarTurnoDeMaquina(respaldo.id, horometro, motivo);
        cerroTurno = true;
        setTurnoCerrado(true);
      }
      await devolverMaquina(maquina.id, versionBase, motivo, observacion.trim() || null);
      onDevuelto();
      onClose();
      mostrarAviso(`${maquina.codigo} volvió a operar`);
    } catch (err) {
      const mensaje = await explicarError(err, 'No se pudo registrar la devolución.');
      setError(cerroTurno ? `El turno de ${respaldo.operadorEnTurno} quedó cerrado, pero: ${mensaje}` : mensaje);
    }
  });

  return (
    <AppBottomSheetModal
      visible={visible}
      onClose={cerrar}
      title="Devolver Equipo"
      superpuesto
      icon={<Undo2 size={22} color={theme.success} />}
      iconBadgeColor={theme.success + '15'}
      footer={
        <>
          <TouchableOpacity style={[styles.boton, { backgroundColor: theme.cardAlt }]} onPress={cerrar} disabled={guardando}>
            <Text style={[styles.botonTexto, { color: theme.text }]}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.boton, styles.botonConIcono, { backgroundColor: theme.success, opacity: listo ? 1 : 0.5 }]}
            onPress={confirmar}
            disabled={!listo}
          >
            {guardando ? <ActivityIndicator color="#FFF" /> : <CheckCircle size={18} color="#FFF" />}
            <Text style={[styles.botonTexto, { color: '#FFF' }]}>{pideCierre ? 'Cerrar turno y devolver' : 'Devolver'}</Text>
          </TouchableOpacity>
        </>
      }
    >
      <Text style={[styles.pregunta, { color: theme.textSecondary }]}>
        {cargando
          ? 'Cargando el respaldo…'
          : `${maquina.codigo} vuelve a operar${respaldo?.operadorAsignado ? ` con ${respaldo.operadorAsignado}` : ''}, y ${maquina.respaldo.codigo} vuelve a quedar ${estadoRespaldo}.`}
      </Text>

      <View style={styles.campo}>
        <SearchableSelect
          label="MOTIVO *"
          placeholder="Buscar o seleccionar motivo..."
          options={MOTIVOS_DEVOLUCION}
          value={motivo || null}
          onChange={(opcion) => setMotivo(opcion ?? '')}
          getOptionKey={comoTexto}
          getOptionLabel={comoTexto}
        />
      </View>

      <View style={styles.campo}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>OBSERVACIONES</Text>
        <TextInput
          style={[styles.textarea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
          value={observacion}
          onChangeText={setObservacion}
          placeholder="Ej. Se cambió la bomba hidráulica; probado en taller."
          placeholderTextColor={theme.textTertiary}
          multiline
          numberOfLines={3}
          maxLength={500}
          textAlignVertical="top"
        />
      </View>

      {pideCierre && respaldo && (
        <CierreTurnoCampos maquina={respaldo} horometro={horometroCierre} onChange={setHorometroCierre} disabled={guardando} />
      )}

      {!!error && (
        <View style={[styles.errorCaja, { backgroundColor: theme.danger + '15', borderColor: theme.danger }]}>
          <AlertTriangle size={16} color={theme.danger} />
          <Text style={[styles.errorTexto, { color: theme.dangerText }]}>{error}</Text>
        </View>
      )}
    </AppBottomSheetModal>
  );
};
