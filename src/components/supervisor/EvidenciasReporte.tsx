import React, { useRef, useState } from 'react';
import { Pressable, View, useColorScheme } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { ImageOff } from 'lucide-react-native';
import { darkTheme, lightTheme } from '../../constants/theme';
import { urlEvidencia, type EvidenciaHistorial } from '../../services/historialService';
import { useTokenSesion } from '../../hooks/useTokenSesion';
import { VisorEvidencias } from './VisorEvidencias';
import { styles } from './EvidenciasReporte.styles';

interface Props {
  evidencias: EvidenciaHistorial[];
  titulo: string; // quién y en qué máquina, para el visor
  descripcion: string | null;
}

/**
 * Miniaturas de las fotos de un reporte en el historial; al tocarlas se abren en pantalla completa.
 * Las fotos piden el token: expo-image lo envía como header y las guarda en disco con su id, así que se
 * descargan una vez y luego se ven aunque no haya señal.
 */
export const EvidenciasReporte: React.FC<Props> = ({ evidencias, titulo, descripcion }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const { token, listo, renovar } = useTokenSesion();
  const [abierta, setAbierta] = useState<number | null>(null);
  // 1 tras renovar la sesión: las fotos se vuelven a montar con el token nuevo
  const [intento, setIntento] = useState(0);
  const [fallidas, setFallidas] = useState<Record<string, true>>({});
  const renovando = useRef(false);

  if (!listo) return null;

  const fuente = (idEvidencia: string): ImageSource => ({
    uri: urlEvidencia(idEvidencia),
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cacheKey: `evidencia-${idEvidencia}`,
  });

  // Lo más probable es que el access token venciera con la pantalla abierta: se renueva una sola vez y se reintenta
  const alFallar = (idEvidencia: string) => {
    if (intento > 0) {
      setFallidas((f) => ({ ...f, [idEvidencia]: true }));
      return;
    }
    if (renovando.current) return;
    renovando.current = true;
    renovar().then((ok) => {
      if (ok) setIntento(1);
      else setFallidas(Object.fromEntries(evidencias.map((e) => [e.id, true as const])));
    });
  };

  return (
    <View style={styles.fila}>
      {evidencias.map((evidencia, i) => (
        <Pressable
          key={`${evidencia.id}-${intento}`}
          onPress={() => setAbierta(i)}
          style={[styles.miniatura, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
          accessibilityRole="imagebutton"
          accessibilityLabel={evidencias.length > 1 ? `Ver foto ${i + 1} de ${evidencias.length}` : 'Ver foto'}
        >
          {fallidas[evidencia.id] ? (
            <ImageOff size={20} color={theme.textTertiary} />
          ) : (
            <Image
              source={fuente(evidencia.id)}
              style={styles.foto}
              contentFit="cover"
              cachePolicy="disk"
              transition={150}
              onError={() => alFallar(evidencia.id)}
            />
          )}
        </Pressable>
      ))}

      {abierta !== null && (
        <VisorEvidencias
          key={intento}
          evidencias={evidencias}
          inicial={abierta}
          titulo={titulo}
          descripcion={descripcion}
          fuente={fuente}
          onCerrar={() => setAbierta(null)}
        />
      )}
    </View>
  );
};
