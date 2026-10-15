import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { AppBottomSheetModal } from '../common/AppBottomSheetModal';
import { SearchableSelect } from '../common/SearchableSelect';
import { darkTheme, lightTheme } from '../../constants/theme';
import { ESTADOS_MAQUINA, EstadoMaquina, presentacionEstado } from '../../constants/estadosMaquina';
import { MaquinaFlota, mapMaquinaFlota } from '../../hooks/useFlotaResumen';
import { cambiarEstadoMaquina } from '../../services/flotaService';
import { styles } from './CambiarEstadoModal.styles';
import { useAccionUnica } from '../../hooks/useAccionUnica';
import { mostrarAviso } from '../../services/retroalimentacion';

interface Props {
  // Máquina a la que se cambia el estado; null = modal cerrado
  maquina: MaquinaFlota | null;
  onClose: () => void;
  // Recibe la máquina tal como quedó en el Backend
  onCambiado: (maquina: MaquinaFlota) => void;
}

// Accesor estable para SearchableSelect (evita recalcular la búsqueda en cada render)
const comoTexto = (valor: string) => valor;

// Botón Estado de la tarjeta: se elige el nuevo estado y un motivo, que queda en la bitácora
// y se muestra en la tarjeta mientras la máquina siga en ese estado
export const CambiarEstadoModal: React.FC<Props> = ({ maquina, onClose, onCambiado }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const [nuevoEstado, setNuevoEstado] = useState<EstadoMaquina | null>(null);
  const [motivo, setMotivo] = useState('');
  const [observacion, setObservacion] = useState('');
  // Bloquea toques repetidos en el botón de confirmar mientras se guarda
  const [guardando, ejecutarUnaVez] = useAccionUnica();
  const [error, setError] = useState<string | null>(null);

  // Cada apertura parte en blanco
  const [abiertaPara, setAbiertaPara] = useState<MaquinaFlota | null>(null);
  if (maquina !== abiertaPara) {
    setAbiertaPara(maquina);
    setNuevoEstado(null);
    setMotivo('');
    setObservacion('');
    setError(null);
  }

  const destino = nuevoEstado ? presentacionEstado(nuevoEstado) : null;
  const acento = destino ? destino.color(theme) : theme.primary;
  const listo = destino !== null && motivo !== '';

  const cerrar = () => {
    if (!guardando) onClose();
  };

  const elegir = (estado: EstadoMaquina) => {
    setNuevoEstado(estado);
    // Los motivos dependen del estado elegido
    setMotivo('');
  };

  const confirmar = () => ejecutarUnaVez(async () => {
    if (!maquina || !destino || !motivo) return;
    setError(null);
    try {
      const actualizada = await cambiarEstadoMaquina(maquina.id, destino.valor, motivo, observacion.trim() || null);
      onCambiado(mapMaquinaFlota(actualizada));
      onClose();
      mostrarAviso(`Equipo ${destino.etiqueta.toLowerCase()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado del equipo.');
    }
  });

  return (
    <AppBottomSheetModal
      visible={maquina !== null}
      onClose={cerrar}
      title="Cambiar Estado del Equipo"
      // Capa sobre la pantalla en vez de un Modal nativo: abre sin la demora de la ventana nueva en Android
      superpuesto
      icon={<Activity size={22} color={acento} />}
      iconBadgeColor={acento + '15'}
      footer={
        <>
          <TouchableOpacity style={[styles.boton, { backgroundColor: theme.cardAlt }]} onPress={cerrar} disabled={guardando}>
            <Text style={[styles.botonTexto, { color: theme.text }]}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.boton, styles.botonConIcono, { backgroundColor: acento, opacity: listo && !guardando ? 1 : 0.5 }]}
            onPress={confirmar}
            disabled={!listo || guardando}
          >
            {guardando ? <ActivityIndicator color="#FFF" /> : <CheckCircle size={18} color="#FFF" />}
            <Text style={[styles.botonTexto, { color: '#FFF' }]}>Confirmar</Text>
          </TouchableOpacity>
        </>
      }
    >
      <Text style={[styles.pregunta, { color: theme.textSecondary }]}>
        {`${maquina?.codigo} está ${maquina ? presentacionEstado(maquina.estado).etiqueta.toLowerCase() : ''}. ¿A qué estado pasa?`}
      </Text>

      <View style={[styles.campo, styles.opciones]}>
        {ESTADOS_MAQUINA.filter((e) => e.valor !== maquina?.estado).map((e) => {
          const elegido = nuevoEstado === e.valor;
          return (
            <TouchableOpacity
              key={e.valor}
              style={[
                styles.opcion,
                { borderColor: elegido ? e.color(theme) : theme.border, backgroundColor: elegido ? e.color(theme) + '15' : theme.background },
              ]}
              onPress={() => elegir(e.valor)}
              disabled={guardando}
              accessibilityRole="radio"
              accessibilityState={{ selected: elegido }}
            >
              <View style={[styles.opcionDot, { backgroundColor: e.color(theme) }]} />
              <Text style={[styles.opcionTexto, { color: theme.text }]}>{e.etiqueta}</Text>
              {elegido && <CheckCircle size={18} color={e.color(theme)} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {nuevoEstado === 'BAJA' && (
        <Text style={[styles.pregunta, { color: theme.dangerText }]}>
          Los operadores no podrán iniciar turno en él. Fuera de servicio se habilita el reemplazo.
        </Text>
      )}

      {destino && (
        <>
          <View style={styles.campo}>
            <SearchableSelect
              label="MOTIVO *"
              placeholder="Buscar o seleccionar motivo..."
              options={destino.motivos}
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
              placeholder="Ej. Fuga de aceite en el cilindro de levante."
              placeholderTextColor={theme.textTertiary}
              multiline
              numberOfLines={3}
              maxLength={500}
              textAlignVertical="top"
            />
          </View>
        </>
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
