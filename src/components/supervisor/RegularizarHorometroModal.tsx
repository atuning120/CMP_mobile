import React, { useRef, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, useColorScheme } from 'react-native';
import { Timer } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { AppBottomSheetModal } from '../common/AppBottomSheetModal';
import { useAccionUnica } from '../../hooks/useAccionUnica';
import { LARGO_MAXIMO_COMENTARIO, type Alerta, type AtencionAlerta } from '../../services/alertasService';
import { type AccionPreparada, nuevaAccion, regularizarHorometroJefe } from '../../services/accionesJefe';
import { mensajeDeError } from '../../utils/errores';
import { leerHorometro } from './CierreTurnoCampos';
import { styles } from './RegularizarHorometroModal.styles';

// Un turno no dura más que esto: más horas de uso suele ser un error al escribir el horómetro
const HORAS_MAXIMAS_TURNO = 13;

const formatoHoras = (valor: number) => valor.toLocaleString('es-CL', { maximumFractionDigits: 2 });

interface Props {
  // Alerta de cierre automático que se regulariza; null = modal cerrado
  alerta: Alerta | null;
  onClose: () => void;
  // Llegó al Backend. Sin señal queda en la cola y la tarjeta la muestra como pendiente
  onRegularizado: (idAlerta: string, atenciones: AtencionAlerta[], horometroFinal: number) => void;
}

/**
 * Informa el horómetro final de un turno que el sistema cerró sin él. Si ya hubo un turno posterior en la máquina, se
 * propone el horómetro con que partió, que además es el máximo permitido. Funciona sin señal: se envía al volver la red.
 */
export const RegularizarHorometroModal: React.FC<Props> = ({ alerta, onClose, onRegularizado }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  // null = aún no lo edita: se muestra el valor sugerido
  const [horometroEscrito, setHorometroEscrito] = useState<string | null>(null);
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState('');
  // Bloquea toques repetidos en el botón mientras se guarda
  const [guardando, ejecutarUnaVez] = useAccionUnica();
  // El mismo UUID y fecha en cada reintento de este modal
  const accion = useRef<AccionPreparada | null>(null);

  const inicial = alerta?.turno.horometroInicial ?? 0;
  const siguiente = alerta?.turno.horometroSiguiente ?? null;
  // Un turno siguiente con un inicial menor que este tiene un error de tipeo: no sirve como sugerencia ni como máximo
  const maximo = siguiente !== null && siguiente >= inicial ? siguiente : null;
  const horometro = horometroEscrito ?? (maximo !== null ? String(maximo) : '');
  const valor = leerHorometro(horometro);
  const muchasHoras = valor !== null && valor - inicial > HORAS_MAXIMAS_TURNO;

  const cerrar = () => {
    if (guardando) return;
    setHorometroEscrito(null);
    setComentario('');
    setError('');
    accion.current = null;
    onClose();
  };

  const guardar = () =>
    ejecutarUnaVez(async () => {
      if (!alerta) return;
      if (valor === null) {
        setError('Ingresa el horómetro final del turno.');
        return;
      }
      if (valor < inicial) {
        setError(`No puede ser menor que el horómetro con que partió el turno (${formatoHoras(inicial)} h).`);
        return;
      }
      if (maximo !== null && valor > maximo) {
        setError(`No puede ser mayor que el horómetro con que partió el turno siguiente (${formatoHoras(maximo)} h).`);
        return;
      }
      setError('');
      try {
        accion.current ??= nuevaAccion();
        const resultado = await regularizarHorometroJefe(alerta, valor, comentario.trim(), accion.current);
        if (resultado.enviada) onRegularizado(alerta.id, resultado.respuesta.atenciones, resultado.respuesta.horometroFinal);
        setHorometroEscrito(null);
        setComentario('');
        accion.current = null;
        onClose();
      } catch (e) {
        setError(mensajeDeError(e, 'No se pudo regularizar el horómetro.'));
      }
    });

  const footer = (
    <>
      <TouchableOpacity style={[styles.botonSecundario, { borderColor: theme.border, backgroundColor: theme.background }]} onPress={cerrar}>
        <Text style={[styles.botonSecundarioTexto, { color: theme.text }]} numberOfLines={1}>
          Cancelar
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.botonPrimario, { backgroundColor: theme.primary, opacity: guardando ? 0.6 : 1 }]}
        onPress={guardar}
        disabled={guardando}
      >
        {guardando ? <ActivityIndicator color="#FFFFFF" /> : <Timer size={18} color="#FFFFFF" />}
        <Text style={styles.botonPrimarioTexto} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          GUARDAR
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <AppBottomSheetModal
      visible={alerta !== null}
      onClose={cerrar}
      title="Regularizar horómetro"
      subtitle={alerta ? `${alerta.operador} · ${alerta.maquina.nombre}` : undefined}
      icon={<Timer size={22} color={theme.primary} />}
      footer={footer}
    >
      <Text style={[styles.etiqueta, { color: theme.textTertiary }]}>HORÓMETRO FINAL DEL TURNO (H) *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.cardAlt, borderColor: theme.border, color: theme.text }]}
        value={horometro}
        onChangeText={setHorometroEscrito}
        keyboardType="decimal-pad"
        placeholder={formatoHoras(inicial)}
        placeholderTextColor={theme.textTertiary}
        editable={!guardando}
        accessibilityLabel="Horómetro final del turno"
      />
      <Text style={[styles.ayuda, { color: theme.textSecondary }]}>
        Partió con {formatoHoras(inicial)} h.{' '}
        {maximo !== null
          ? `El turno siguiente de la máquina partió con ${formatoHoras(maximo)} h: es el máximo posible.`
          : 'Léelo en la cabina de la máquina.'}
      </Text>
      {muchasHoras && (
        <Text style={[styles.ayuda, { color: theme.warningText }]}>
          Son {formatoHoras(valor - inicial)} horas de uso en un turno: revisa que esté bien escrito.
        </Text>
      )}
      <Text style={[styles.etiqueta, styles.etiquetaComentario, { color: theme.textTertiary }]}>COMENTARIO (OPCIONAL):</Text>
      <TextInput
        style={[styles.comentario, { backgroundColor: theme.cardAlt, borderColor: theme.border, color: theme.text }]}
        multiline
        maxLength={LARGO_MAXIMO_COMENTARIO}
        value={comentario}
        onChangeText={setComentario}
        textAlignVertical="top"
        placeholder="Ej: lectura tomada en cabina"
        placeholderTextColor={theme.textTertiary}
        editable={!guardando}
      />
      {error !== '' && <Text style={[styles.error, { color: theme.dangerText }]}>{error}</Text>}
    </AppBottomSheetModal>
  );
};
