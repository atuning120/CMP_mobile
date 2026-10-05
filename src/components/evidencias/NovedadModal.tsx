import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, Image, ActivityIndicator, useColorScheme } from 'react-native';
import { Camera, Save } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { AppBottomSheetModal } from '../common/AppBottomSheetModal';
import { FotoCapturada } from '../../types/turno';
import { styles } from './NovedadModal.styles';

interface Props {
  foto: FotoCapturada | null;
  onClose: () => void;
  onGuardar: (descripcion: string) => Promise<void>;
}

/**
 * Describe la foto recién tomada antes de guardarla como novedad del turno. Se guarda en el
 * teléfono y se sube en segundo plano.
 */
export const NovedadModal: React.FC<Props> = ({ foto, onClose, onGuardar }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const [descripcion, setDescripcion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cerrar = () => {
    if (guardando) return;
    setDescripcion('');
    setError('');
    onClose();
  };

  const guardar = async () => {
    setGuardando(true);
    setError('');
    try {
      await onGuardar(descripcion);
      setDescripcion('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la evidencia.');
    } finally {
      setGuardando(false);
    }
  };

  const footer = (
    <>
      <TouchableOpacity style={[styles.botonSecundario, { borderColor: theme.border, backgroundColor: theme.background }]} onPress={cerrar}>
        <Text style={[styles.botonSecundarioTexto, { color: theme.text }]}>Descartar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.botonPrimario, { backgroundColor: theme.primary, opacity: guardando ? 0.6 : 1 }]} onPress={guardar} disabled={guardando}>
        {guardando ? <ActivityIndicator color="#FFFFFF" /> : <Save size={18} color="#FFFFFF" />}
        <Text style={styles.botonPrimarioTexto}>GUARDAR EVIDENCIA</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <AppBottomSheetModal
      visible={foto !== null}
      onClose={cerrar}
      title="Nueva Evidencia"
      icon={<Camera size={22} color={theme.primary} />}
      footer={footer}
    >
      {foto && <Image source={{ uri: foto.uri }} style={styles.foto} resizeMode="cover" />}
      <Text style={[styles.etiqueta, { color: theme.textTertiary }]}>DESCRIPCIÓN DE LA NOVEDAD:</Text>
      <TextInput
        style={[styles.descripcion, { backgroundColor: theme.cardAlt, borderColor: theme.border, color: theme.text }]}
        multiline
        maxLength={500}
        value={descripcion}
        onChangeText={setDescripcion}
        textAlignVertical="top"
        placeholder="Ej: fuga de aceite en cilindro de levante, desgaste irregular de neumático..."
        placeholderTextColor={theme.textTertiary}
        editable={!guardando}
      />
      <Text style={[styles.contador, { color: theme.textTertiary }]}>{descripcion.length}/500</Text>
      {error !== '' && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}
    </AppBottomSheetModal>
  );
};
