import React, { useRef, useState } from 'react';
import * as Crypto from 'expo-crypto';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, useColorScheme } from 'react-native';
import { CheckCircle, MessageSquarePlus } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { AppBottomSheetModal } from '../common/AppBottomSheetModal';
import { useAccionUnica } from '../../hooks/useAccionUnica';
import { LARGO_MAXIMO_COMENTARIO, type Alerta, type AtencionAlerta } from '../../services/alertasService';
import { type AccionPreparada, atenderAlertaJefe } from '../../services/accionesJefe';
import { styles } from './AtenderAlertaModal.styles';
import { mensajeDeError } from '../../utils/errores';

interface Props {
  // Alerta que se atiende; null = modal cerrado
  alerta: Alerta | null;
  onClose: () => void;
  // Llegó al Backend: todas sus atenciones. Sin señal queda en la cola y la tarjeta la muestra como pendiente
  onAtendida: (idAlerta: string, atenciones: AtencionAlerta[]) => void;
}

/**
 * Atiende una alerta (comentario opcional) o, si ya fue atendida, le agrega una nota (comentario obligatorio).
 * Nada se edita ni se borra: queda quién lo hizo, cuándo y qué dijo. Funciona sin señal: se envía al volver la red.
 */
export const AtenderAlertaModal: React.FC<Props> = ({ alerta, onClose, onAtendida }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState('');
  // Bloquea toques repetidos en el botón mientras se guarda
  const [guardando, ejecutarUnaVez] = useAccionUnica();
  const esNota = (alerta?.atenciones?.length ?? 0) > 0;
  // Identifica esta atención: si la respuesta no llega y se reintenta, el Backend no la registra dos veces.
  // La fecha es la del primer intento: es cuando el jefe de turno la atendió
  const atencion = useRef<AccionPreparada | null>(null);

  const cerrar = () => {
    if (guardando) return;
    setComentario('');
    setError('');
    atencion.current = null;
    onClose();
  };

  const guardar = () =>
    ejecutarUnaVez(async () => {
      if (!alerta) return;
      if (esNota && !comentario.trim()) {
        setError('Escribe la nota que quieres agregar.');
        return;
      }
      setError('');
      try {
        atencion.current ??= { idCliente: Crypto.randomUUID(), fechaAccion: new Date().toISOString() };
        const resultado = await atenderAlertaJefe(alerta, comentario.trim(), atencion.current);
        if (resultado.enviada) onAtendida(alerta.id, resultado.respuesta);
        setComentario('');
        atencion.current = null;
        onClose();
      } catch (e) {
        setError(mensajeDeError(e, 'No se pudo guardar la atención.'));
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
        style={[styles.botonPrimario, { backgroundColor: esNota ? theme.primary : theme.success, opacity: guardando ? 0.6 : 1 }]}
        onPress={guardar}
        disabled={guardando}
      >
        {guardando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : esNota ? (
          <MessageSquarePlus size={18} color="#FFFFFF" />
        ) : (
          <CheckCircle size={18} color="#FFFFFF" />
        )}
        <Text style={styles.botonPrimarioTexto} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {esNota ? 'AGREGAR NOTA' : 'ATENDIDA'}
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <AppBottomSheetModal
      visible={alerta !== null}
      onClose={cerrar}
      title={esNota ? 'Agregar nota' : 'Atender alerta'}
      subtitle={alerta ? `${alerta.operador} · ${alerta.maquina.nombre}` : undefined}
      icon={esNota ? <MessageSquarePlus size={22} color={theme.primary} /> : <CheckCircle size={22} color={theme.success} />}
      footer={footer}
    >
      <Text style={[styles.etiqueta, { color: theme.textTertiary }]}>{esNota ? 'NOTA (OBLIGATORIA):' : 'COMENTARIO (OPCIONAL):'}</Text>
      <TextInput
        style={[styles.comentario, { backgroundColor: theme.cardAlt, borderColor: theme.border, color: theme.text }]}
        multiline
        maxLength={LARGO_MAXIMO_COMENTARIO}
        value={comentario}
        onChangeText={setComentario}
        textAlignVertical="top"
        placeholder={esNota ? 'Ej: cerró el turno a las 23:10' : 'Ej: se llamó al operador, cierra al terminar la carga'}
        placeholderTextColor={theme.textTertiary}
        editable={!guardando}
      />
      <Text style={[styles.contador, { color: theme.textTertiary }]}>
        {comentario.length}/{LARGO_MAXIMO_COMENTARIO}
      </Text>
      {error !== '' && <Text style={[styles.error, { color: theme.dangerText }]}>{error}</Text>}
    </AppBottomSheetModal>
  );
};
