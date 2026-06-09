import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export type MotivoCancelamento = 'area_risco' | 'pneu_furou' | 'acidente';

const MOTIVOS: { value: MotivoCancelamento; label: string; icon: string }[] = [
  { value: 'area_risco', label: 'Área de Risco', icon: 'warning' },
  { value: 'pneu_furou', label: 'Pneu furou', icon: 'car-sport' },
  { value: 'acidente', label: 'Me envolvi em um acidente', icon: 'medkit' },
];

interface Props {
  visible: boolean;
  loading: boolean;
  onConfirm: (motivo: MotivoCancelamento, fotoUri: string) => void;
  onClose: () => void;
}

export function CancelCorridaModal({ visible, loading, onConfirm, onClose }: Props) {
  const [step, setStep] = useState<'motivo' | 'foto'>('motivo');
  const [motivo, setMotivo] = useState<MotivoCancelamento | null>(null);
  const [fotoUri, setFotoUri] = useState<string | null>(null);

  const resetAndClose = useCallback(() => {
    setStep('motivo');
    setMotivo(null);
    setFotoUri(null);
    onClose();
  }, [onClose]);

  const handleSelecionarMotivo = useCallback((m: MotivoCancelamento) => {
    setMotivo(m);
    setStep('foto');
  }, []);

  const handleTirarFoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à câmera para continuar.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setFotoUri(result.assets[0].uri);
    }
  }, []);

  const handleConfirmar = useCallback(() => {
    if (motivo && fotoUri) onConfirm(motivo, fotoUri);
  }, [motivo, fotoUri, onConfirm]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetAndClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              {step === 'foto' && (
                <TouchableOpacity
                  onPress={() => {
                    setStep('motivo');
                    setFotoUri(null);
                  }}
                  style={s.backBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={18} color="#000933" />
                </TouchableOpacity>
              )}
              <Text style={s.title}>Cancelar corrida</Text>
            </View>
            <TouchableOpacity onPress={resetAndClose} disabled={loading} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#000933" />
            </TouchableOpacity>
          </View>

          <View style={s.warningBanner}>
            <Ionicons name="warning-outline" size={15} color="#92400E" />
            <Text style={s.warningText}>
              O pedido voltará para a fila para outros entregadores.
            </Text>
          </View>

          {/* Etapa 1 — Selecionar motivo */}
          {step === 'motivo' && (
            <>
              <Text style={s.stepLabel}>Qual é o motivo?</Text>
              {MOTIVOS.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={s.motivoItem}
                  onPress={() => handleSelecionarMotivo(m.value)}
                  activeOpacity={0.8}
                >
                  <View style={s.motivoIconWrap}>
                    <Ionicons name={m.icon as any} size={20} color="#9B2727" />
                  </View>
                  <Text style={s.motivoLabel}>{m.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9099B3" />
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Etapa 2 — Tirar foto */}
          {step === 'foto' && (
            <>
              <Text style={s.stepLabel}>
                Motivo:{' '}
                <Text style={s.motivoSelected}>
                  {MOTIVOS.find((m) => m.value === motivo)?.label}
                </Text>
              </Text>
              <Text style={s.fotoHint}>
                Tire uma foto do local ou da moto para registrar o ocorrido.
              </Text>

              {!fotoUri ? (
                <TouchableOpacity style={s.fotoBtn} onPress={handleTirarFoto} activeOpacity={0.8}>
                  <Ionicons name="camera" size={32} color="#9B2727" />
                  <Text style={s.fotoBtnText}>Tirar foto</Text>
                  <Text style={s.fotoBtnSub}>Obrigatório para prosseguir</Text>
                </TouchableOpacity>
              ) : (
                <View style={s.fotoPreview}>
                  <Image source={{ uri: fotoUri }} style={s.fotoImg} resizeMode="cover" />
                  <TouchableOpacity
                    style={s.fotoRetake}
                    onPress={handleTirarFoto}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="refresh" size={14} color="#fff" />
                    <Text style={s.fotoRetakeTxt}>Tirar outra</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[s.confirmBtn, (!fotoUri || loading) && { opacity: 0.5 }]}
                onPress={handleConfirmar}
                disabled={!fotoUri || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={s.confirmBtnText}>Confirmar cancelamento</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { padding: 2 },
  title: { fontSize: 18, fontWeight: '700', color: '#000933' },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  warningText: { flex: 1, fontSize: 12.5, color: '#92400E', lineHeight: 18 },
  stepLabel: { fontSize: 13, fontWeight: '600', color: '#9099B3', marginBottom: 14 },
  motivoSelected: { color: '#9B2727', fontWeight: '700' },
  motivoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    marginBottom: 10,
  },
  motivoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  motivoLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#000933' },
  fotoHint: { fontSize: 12.5, color: '#9099B3', lineHeight: 18, marginBottom: 16 },
  fotoBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#9B2727',
    backgroundColor: '#FEF2F2',
    marginBottom: 16,
  },
  fotoBtnText: { fontSize: 15, fontWeight: '700', color: '#9B2727' },
  fotoBtnSub: { fontSize: 11, color: '#9099B3' },
  fotoPreview: {
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  fotoImg: { width: '100%', height: '100%' },
  fotoRetake: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  fotoRetakeTxt: { fontSize: 11, color: '#fff', fontWeight: '600' },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#9B2727',
    borderRadius: 14,
    paddingVertical: 16,
  },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
