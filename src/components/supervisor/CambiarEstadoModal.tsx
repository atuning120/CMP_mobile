import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { AlertTriangle, CheckCircle, Power } from 'lucide-react-native';
import { AppBottomSheetModal } from '../common/AppBottomSheetModal';
import { SearchableSelect } from '../common/SearchableSelect';
import { darkTheme, lightTheme } from '../../constants/theme';
import { MOTIVOS_DESHABILITAR, MOTIVOS_HABILITAR } from '../../constants/motivosJefeTurno';
import { MaquinaFlota, mapMaquinaFlota } from '../../hooks/useFlotaResumen';
import { cambiarEstadoMaquina } from '../../services/flotaService';
import { styles } from './CambiarEstadoModal.styles';

interface Props {
  // Máquina a habilitar o deshabilitar (según su estado actual); null = modal cerrado
  maquina: MaquinaFlota | null;
  onClose: () => void;
  // Recibe la máquina tal como quedó en el Backend
  onCambiado: (maquina: MaquinaFlota) => void;
}

// Accesor estable para SearchableSelect (evita recalcular la búsqueda en cada render)
const comoTexto = (valor: string) => valor;

// Confirmación del botón Habilitar / Deshabilitar de la tarjeta: el motivo queda en la bitácora
// y, al deshabilitar, se muestra en la tarjeta mientras siga fuera de servicio
export const CambiarEstadoModal: React.FC<Props> = ({ maquina, onClose, onCambiado }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const [motivo, setMotivo] = useState('');
  const [observacion, setObservacion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cada apertura parte en blanco
  const [abiertaPara, setAbiertaPara] = useState<MaquinaFlota | null>(null);
  if (maquina !== abiertaPara) {
    setAbiertaPara(maquina);
    setMotivo('');
    setObservacion('');
    setError(null);
  }

  const deshabilitar = maquina?.estadoOperativo === 'OPERATIVO';
  const acento = deshabilitar ? theme.danger : theme.success;

  const cerrar = () => {
    if (!guardando) onClose();
  };

  const confirmar = async () => {
    if (!maquina || !motivo) return;
    setGuardando(true);
    setError(null);
    try {
      const actualizada = await cambiarEstadoMaquina(maquina.id, deshabilitar ? 'BAJA' : 'ACTIVA', motivo, observacion.trim() || null);
      onCambiado(mapMaquinaFlota(actualizada));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado del equipo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <AppBottomSheetModal
      visible={maquina !== null}
      onClose={cerrar}
      title={deshabilitar ? 'Confirmar Deshabilitación' : 'Confirmar Habilitación'}
      icon={<Power size={22} color={acento} />}
      iconBadgeColor={acento + '15'}
      footer={
        <>
          <TouchableOpacity style={[styles.boton, { backgroundColor: theme.cardAlt }]} onPress={cerrar} disabled={guardando}>
            <Text style={[styles.botonTexto, { color: theme.text }]}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.boton, styles.botonConIcono, { backgroundColor: acento, opacity: motivo && !guardando ? 1 : 0.5 }]}
            onPress={confirmar}
            disabled={!motivo || guardando}
          >
            {guardando ? <ActivityIndicator color="#FFF" /> : <CheckCircle size={18} color="#FFF" />}
            <Text style={[styles.botonTexto, { color: '#FFF' }]}>{deshabilitar ? 'Deshabilitar' : 'Habilitar'}</Text>
          </TouchableOpacity>
        </>
      }
    >
      <Text style={[styles.pregunta, { color: theme.textSecondary }]}>
        {deshabilitar
          ? `¿Deseas deshabilitar el equipo ${maquina?.codigo}? Pasará a "Fuera de Servicio" y los operadores no podrán iniciar turno en él.`
          : `¿Confirmas que el equipo ${maquina?.codigo} está listo para operar?`}
      </Text>

      <View style={styles.campo}>
        <SearchableSelect
          label="MOTIVO *"
          placeholder="Buscar o seleccionar motivo..."
          options={deshabilitar ? MOTIVOS_DESHABILITAR : MOTIVOS_HABILITAR}
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
          placeholder={deshabilitar ? 'Ej. Fuga de aceite en el cilindro de levante.' : 'Ej. Se cambió el sello del cilindro.'}
          placeholderTextColor={theme.textTertiary}
          multiline
          numberOfLines={3}
          maxLength={500}
          textAlignVertical="top"
        />
      </View>

      {!!error && (
        <View style={[styles.errorCaja, { backgroundColor: theme.danger + '15', borderColor: theme.danger }]}>
          <AlertTriangle size={16} color={theme.danger} />
          <Text style={[styles.errorTexto, { color: theme.danger }]}>{error}</Text>
        </View>
      )}
    </AppBottomSheetModal>
  );
};
