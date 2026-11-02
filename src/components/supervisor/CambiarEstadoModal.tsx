import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { AppBottomSheetModal } from '../common/AppBottomSheetModal';
import { SearchableSelect } from '../common/SearchableSelect';
import { darkTheme, lightTheme } from '../../constants/theme';
import { conRegreso, ESTADOS_MAQUINA, EstadoMaquina, operaEnEstado, presentacionEstado } from '../../constants/estadosMaquina';
import { MaquinaFlota, mapMaquinaFlota } from '../../hooks/useFlotaResumen';
import { type AccionPreparada, cerrarTurnoJefe, DETALLE_SIN_SENAL, editarMaquinaJefe, nuevaAccion } from '../../services/accionesJefe';
import { CierreTurnoCampos, leerHorometro } from './CierreTurnoCampos';
import { RegresoEstimadoChips, regresoDesdeAhora } from './RegresoEstimadoChips';
import { styles } from './CambiarEstadoModal.styles';
import { useAccionUnica } from '../../hooks/useAccionUnica';
import { mostrarAviso } from '../../services/retroalimentacion';
import { useVersionBase } from '../../hooks/useVersionBase';

interface Props {
  // Máquina a la que se cambia el estado; null = modal cerrado
  maquina: MaquinaFlota | null;
  onClose: () => void;
  // Recibe la máquina tal como quedó en el Backend (sin señal el cambio queda en la cola y la flota lo muestra pendiente)
  onCambiado: (maquina: MaquinaFlota) => void;
}

// Accesor estable para SearchableSelect (evita recalcular la búsqueda en cada render)
const comoTexto = (valor: string) => valor;

// Botón Estado de la tarjeta: se elige el nuevo estado y un motivo, que queda en la bitácora
// y se muestra en la tarjeta mientras la máquina siga en ese estado. Funciona sin señal, salvo cerrar el turno en curso
export const CambiarEstadoModal: React.FC<Props> = ({ maquina, onClose, onCambiado }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const [nuevoEstado, setNuevoEstado] = useState<EstadoMaquina | null>(null);
  const [motivo, setMotivo] = useState('');
  const [observacion, setObservacion] = useState('');
  const [horasRegreso, setHorasRegreso] = useState<number | null>(null);
  const [horometroCierre, setHorometroCierre] = useState('');
  // Si el cambio falla después de cerrar el turno, al reintentar no se vuelve a cerrar
  const [turnoCerrado, setTurnoCerrado] = useState(false);
  // Bloquea toques repetidos en el botón de confirmar mientras se guarda
  const [guardando, ejecutarUnaVez] = useAccionUnica();
  const [error, setError] = useState<string | null>(null);
  const { versionBase, explicarError } = useVersionBase(maquina);
  // El mismo UUID en cada reintento de esta apertura: el Backend no aplica el cambio dos veces
  const [accion, setAccion] = useState<AccionPreparada | null>(null);

  // Cada apertura parte en blanco
  const [abiertaPara, setAbiertaPara] = useState<MaquinaFlota | null>(null);
  if (maquina !== abiertaPara) {
    setAbiertaPara(maquina);
    setNuevoEstado(null);
    setMotivo('');
    setObservacion('');
    setHorasRegreso(null);
    setHorometroCierre('');
    setTurnoCerrado(false);
    setError(null);
    setAccion(null);
  }

  const destino = nuevoEstado ? presentacionEstado(nuevoEstado) : null;
  const acento = destino ? destino.color(theme) : theme.primary;
  // Sacarla de operación con un operador trabajando: primero se cierra su turno con el horómetro final
  const pideCierre = !!(nuevoEstado && !operaEnEstado(nuevoEstado) && maquina?.operadorEnTurno && !turnoCerrado);
  const horometro = leerHorometro(horometroCierre);
  const cierreListo = !pideCierre || (horometro !== null && horometro >= (maquina?.horometroActual ?? 0));
  const listo = destino !== null && motivo !== '' && cierreListo;

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
    // El mismo UUID en cada reintento (cierre y cambio): el Backend no los aplica dos veces
    const preparada = accion ?? nuevaAccion();
    setAccion(preparada);
    let cerroTurno = false;
    try {
      if (pideCierre && horometro !== null) {
        // Sin señal queda en la cola antes del cambio, que lo espera
        const cierre = await cerrarTurnoJefe(maquina, horometro, motivo, preparada);
        cerroTurno = true;
        setTurnoCerrado(true);
        // Otro lo cerró antes (gana el primer cierre): se avisa quién y cuándo, y el cambio sigue
        if (cierre.estado === 'ya-cerrado') mostrarAviso(cierre.mensaje, { tipo: 'info' });
      }
      // undefined no toca el regreso: se mantiene si sigue fuera de operación y el Backend lo borra si vuelve a operar
      const regreso = conRegreso(destino.valor) && horasRegreso !== null ? regresoDesdeAhora(horasRegreso).toISOString() : undefined;
      const obs = observacion.trim() || null;
      const resultado = await editarMaquinaJefe(
        maquina,
        { estado: destino.valor, motivo, observacion: obs, regresoEstimado: regreso, versionBase },
        {
          estado: destino.valor,
          // La tarjeta lo muestra si no queda activa, como el motivo que entrega el Backend
          motivoEstado: [motivo, obs].filter(Boolean).join(': '),
          regresoEstimado: conRegreso(destino.valor) ? (regreso ?? maquina.regresoEstimado) : null,
        },
        preparada,
      );
      if (resultado.enviada) onCambiado(mapMaquinaFlota(resultado.respuesta));
      onClose();
      mostrarAviso(`Equipo ${destino.etiqueta.toLowerCase()}`, resultado.enviada ? {} : { detalle: DETALLE_SIN_SENAL, tipo: 'info' });
    } catch (err) {
      const mensaje = await explicarError(err, 'No se pudo cambiar el estado del equipo.');
      // El turno pudo quedar cerrado aunque el cambio fallara: al reintentar ya no se pide el horómetro
      setError(cerroTurno ? `El turno de ${maquina.operadorEnTurno} quedó cerrado, pero: ${mensaje}` : mensaje);
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
            <Text style={[styles.botonTexto, { color: '#FFF' }]}>{pideCierre ? 'Cerrar turno y confirmar' : 'Confirmar'}</Text>
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

      {nuevoEstado && !operaEnEstado(nuevoEstado) && (
        <Text style={[styles.pregunta, { color: theme.dangerText }]}>
          Los operadores no podrán iniciar turno en él. Si necesitas que otro equipo lo cubra, usa Sustituir / Reemplazo.
        </Text>
      )}

      {destino && (
        <>
          {conRegreso(destino.valor) && maquina && (
            <RegresoEstimadoChips horas={horasRegreso} onChange={setHorasRegreso} codigo={maquina.codigo} disabled={guardando} />
          )}

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

      {pideCierre && maquina && (
        <CierreTurnoCampos maquina={maquina} horometro={horometroCierre} onChange={setHorometroCierre} disabled={guardando} />
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
