import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, useColorScheme, Platform, KeyboardAvoidingView } from 'react-native';
import { X, CheckSquare, ChevronDown, Camera, MapPin, Check, ClipboardCheck, CheckCircle } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { darkTheme, lightTheme } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const MOCK_MAQUINAS = [
  { id: 'CF-01', tipo: 'Cargador Frontal', modelo: 'CAT 988K High Lift', horometro: '4855.6' },
  { id: 'CF-02', tipo: 'Cargador Frontal', modelo: 'CAT 988K Standard', horometro: '5931.2' },
  { id: 'CF-03', tipo: 'Cargador Frontal', modelo: 'Komatsu WA600-8', horometro: '2310.8' },
  { id: 'BD-01', tipo: 'Bulldozer', modelo: 'CAT D10T2 Heavy Crawler', horometro: '7420.5' },
  { id: 'EX-01', tipo: 'Excavadora', modelo: 'CAT 349D2 L Hydraulic', horometro: '6184.9' },
  { id: 'RX-01', tipo: 'Retroexcavadora', modelo: 'CAT 420F2 4WD', horometro: '3120.1' },
];

export const StartShiftModal: React.FC<Props> = ({ visible, onClose, onConfirm }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const isDark = colorScheme === 'dark';

  const [selectedMaquina, setSelectedMaquina] = useState('CF-01');
  const [horometro, setHorometro] = useState('');
  const [instrucciones, setInstrucciones] = useState('');

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

  return (
    <Modal visible={visible} animationType="none" transparent={true} onRequestClose={onClose}>
      <Animated.View
        style={styles.modalOverlay}
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
      >
        <Animated.View
          entering={SlideInDown.springify().damping(28).stiffness(250).mass(0.8)}
          exiting={SlideOutDown.duration(200)}
          style={{ flexShrink: 1, width: '100%', alignItems: 'center' }}
        >
          <SafeAreaView style={[styles.modalContent, { backgroundColor: theme.card }]} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
              <View style={styles.headerLeft}>
                <View style={[styles.iconBadge, { backgroundColor: theme.success + '15' }]}>
                  <ClipboardCheck size={22} color={theme.success} />
                </View>
                <View style={{ flexShrink: 1 }}>
                  <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                    Inicio de Turno
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.cardAlt }]}>
                <X size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flexShrink: 1 }}>
              <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>

                {/* Sección Maquinaria */}
                <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>SELECCIONAR MAQUINARIA ASIGNADA:</Text>
                <View style={styles.gridContainer}>
                  {MOCK_MAQUINAS.map((maq) => {
                    const isSelected = selectedMaquina === maq.id;
                    return (
                      <TouchableOpacity
                        key={maq.id}
                        style={[
                          styles.maquinaCard,
                          {
                            backgroundColor: isSelected ? theme.primary + '20' : theme.cardAlt,
                            borderColor: isSelected ? theme.primary : theme.border,
                            borderWidth: isSelected ? 2 : 1,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: isSelected ? 0 : 0.05,
                            shadowRadius: 4,
                            elevation: isSelected ? 0 : 1,
                          }
                        ]}
                        onPress={() => setSelectedMaquina(maq.id)}
                      >
                        <View style={styles.maquinaCardTop}>
                          <Text style={[styles.maquinaId, { color: theme.text }]}>{maq.id}</Text>
                          <Text style={[styles.maquinaTipo, { color: theme.warning }]}>{maq.tipo}</Text>
                        </View>
                        <Text style={[styles.maquinaModelo, { color: theme.textSecondary }]} numberOfLines={1}>{maq.modelo}</Text>
                        <Text style={[styles.maquinaHorom, { color: theme.textSecondary }]}>
                          Horóm: <Text style={{ color: theme.warning, fontWeight: 'bold' }}>{maq.horometro} hrs</Text>
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Área y Zona */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>ÁREA DE OPERACIÓN PRINCIPAL:</Text>
                  <TouchableOpacity style={[styles.dropdown, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
                    <Text style={[styles.dropdownText, { color: theme.text }]} numberOfLines={1}>Área 55 (Carguío de Trenes) (Prioridad)</Text>
                    <ChevronDown size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={{ marginBottom: 24 }}>
                  <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>ZONA DE TRABAJO ESPECÍFICA:</Text>
                  <TouchableOpacity style={[styles.dropdown, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
                    <Text style={[styles.dropdownText, { color: theme.text }]} numberOfLines={1}>Vía Férrea 1 - Espolón Sur</Text>
                    <ChevronDown size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Horómetro */}
                <View style={[styles.horometroContainer, { backgroundColor: theme.cardAlt, borderColor: theme.border, alignItems: 'center', paddingVertical: 24 }]}>
                  <Text style={[styles.sectionTitle, { color: theme.textTertiary, textAlign: 'center', marginBottom: 16 }]}>
                    HORÓMETRO INICIAL EN CABINA
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.warning,
                          backgroundColor: theme.background,
                          borderColor: theme.border,
                          textAlign: 'center',
                          fontSize: 34,
                          paddingVertical: 12,
                          width: 200,
                          flex: 0,
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
                </View>

                {/* Evidencias */}
                <Text style={[styles.sectionTitle, { color: theme.textTertiary, marginTop: 16 }]}>EVIDENCIA FOTOGRÁFICA DE PRE-USO (OPCIONAL):</Text>
                <TouchableOpacity style={[styles.evidenciaBtn, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
                  <View style={[styles.evidenciaIconBadge, { backgroundColor: theme.primary + '15' }]}>
                    <Camera size={26} color={theme.primary} />
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.evidenciaTitle, { color: theme.text }]}>Adjuntar Foto de Evidencia</Text>
                    <Text style={[styles.evidenciaSub, { color: theme.textSecondary }]}>Toca aquí para abrir la cámara (Opcional)</Text>
                  </View>
                </TouchableOpacity>

                {/* Instrucciones */}
                <Text style={[styles.sectionTitle, { color: theme.textTertiary, marginTop: 16 }]}>INSTRUCCIONES / DESCRIPCIÓN DEL TRABAJO:</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: theme.cardAlt, borderColor: theme.border, color: theme.text }]}
                  multiline
                  scrollEnabled={false}
                  maxLength={250}
                  value={instrucciones}
                  onChangeText={setInstrucciones}
                  textAlignVertical="top"
                  placeholder="Opcional: Añade observaciones adicionales aquí..."
                  placeholderTextColor={theme.textTertiary}
                />
                <Text style={{ textAlign: 'right', fontSize: 10, color: theme.textTertiary, marginTop: 6, fontWeight: '500' }}>
                  {instrucciones.length}/250
                </Text>

                {/* Espacio final */}
                <View style={{ height: 40 }} />
              </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer Buttons */}
            <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
              <TouchableOpacity style={[styles.footerBtn, { borderColor: theme.border, backgroundColor: theme.background }]} onPress={onClose}>
                <Text style={[styles.footerBtnText, { color: theme.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.footerBtnConfirm, { backgroundColor: theme.success }]} onPress={onConfirm}>
                <CheckCircle size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={[styles.footerBtnConfirmText, { color: '#FFFFFF' }]}>INICIAR TURNO OFICIAL</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 600,
    maxHeight: '85%',
    borderRadius: 20,
    overflow: 'hidden',
    flexShrink: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
    paddingRight: 16,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flexShrink: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 20,
  },
  maquinaCard: {
    width: '31%',
    minWidth: 150,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  maquinaCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  maquinaId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  maquinaTipo: {
    fontSize: 10,
    opacity: 0.8,
  },
  maquinaModelo: {
    fontSize: 12,
    marginBottom: 4,
  },
  maquinaHorom: {
    fontSize: 11,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  flexHalf: {
    flex: 1,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  dropdownText: {
    fontSize: 14,
    flex: 1,
  },
  helperText: {
    fontSize: 11,
    marginBottom: 20,
  },
  horometroContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  horometroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  horometroInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 22,
    fontWeight: 'bold',
  },
  modificarBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modificarBtnText: {
    fontWeight: 'bold',
  },
  evidenciaBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderStyle: 'dashed',
    gap: 12,
    marginBottom: 8,
  },
  evidenciaIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  evidenciaTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  evidenciaSub: {
    fontSize: 12,
    textAlign: 'center',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  footerBtn: {
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
