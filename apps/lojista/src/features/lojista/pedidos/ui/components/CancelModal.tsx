import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOTIVOS_CANCELAMENTO, type OrderStatus } from '../../lib';

interface Props {
  data: { orderId: string; dbId: string; status: OrderStatus } | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (dbId: string, motivo: string) => void;
}

export function CancelModal({ data, loading = false, onClose, onConfirm }: Props) {
  const [step, setStep] = useState<'motivo' | 'confirmar'>('motivo');
  const [motivo, setMotivo] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setStep('motivo');
      setMotivo(null);
    }
  }, [data]);

  if (!data) return null;

  const penaliza = ['preparando', 'pronto'].includes(data.status);
  const motivoLabel = MOTIVOS_CANCELAMENTO.find((m) => m.value === motivo)?.label ?? '';

  const handleSelectMotivo = (m: string) => {
    setMotivo(m);
    setStep('confirmar');
  };

  const handleFinal = () => {
    if (!motivo || loading) return;
    onConfirm(data.dbId, motivo);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={loading ? undefined : onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalBox}>
          <View style={s.modalHeader}>
            <View style={s.headerLeft}>
              {step === 'confirmar' && (
                <TouchableOpacity
                  onPress={() => {
                    if (!loading) setStep('motivo');
                  }}
                  disabled={loading}
                  style={s.backBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={18} color="#000933" />
                </TouchableOpacity>
              )}
              <Text style={s.modalTitulo}>Cancelar pedido</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={loading} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#000933" />
            </TouchableOpacity>
          </View>

          <Text style={s.modalSub}>{data.orderId}</Text>

          {penaliza && (
            <View style={s.penaltyWarn}>
              <Ionicons name="warning-outline" size={14} color="#B45309" />
              <Text style={s.penaltyTxt}>
                Cancelar após aceitar o pedido conta como penalidade e afeta o ranqueamento da loja.
              </Text>
            </View>
          )}

          {step === 'motivo' && (
            <>
              <Text style={[s.modalSub, { marginTop: 14, marginBottom: 12 }]}>
                Selecione o motivo:
              </Text>
              {MOTIVOS_CANCELAMENTO.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={s.motivoItem}
                  onPress={() => handleSelectMotivo(m.value)}
                  activeOpacity={0.8}
                >
                  <Text style={s.motivoLabel}>{m.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9099B3" />
                </TouchableOpacity>
              ))}
            </>
          )}

          {step === 'confirmar' && (
            <>
              <View style={s.confirmBox}>
                <Text style={s.confirmTitulo}>Tem certeza que deseja cancelar?</Text>
                <Text style={s.confirmDesc}>
                  Esta ação não pode ser desfeita. O consumidor será avisado e o estoque dos itens
                  voltará para o catálogo.
                </Text>
                <View style={s.motivoChip}>
                  <Text style={s.motivoChipLabel}>Motivo</Text>
                  <Text style={s.motivoChipValue}>{motivoLabel}</Text>
                </View>
              </View>

              <View style={s.actionsRow}>
                <TouchableOpacity
                  style={[s.btnSecundario, loading && { opacity: 0.5 }]}
                  onPress={onClose}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={s.btnSecundarioTxt}>Voltar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.btnConfirmar, loading && { opacity: 0.6 }]}
                  onPress={handleFinal}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={16} color="#fff" />
                      <Text style={s.btnConfirmarTxt}>Confirmar cancelamento</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { padding: 2 },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: '#000933' },
  modalSub: { fontSize: 12, color: '#9099B3', marginBottom: 16 },
  penaltyWarn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  penaltyTxt: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 17 },
  motivoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    marginBottom: 10,
  },
  motivoLabel: { fontSize: 14, fontWeight: '600', color: '#000933' },
  confirmBox: {
    marginTop: 14,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  confirmTitulo: { fontSize: 16, fontWeight: '700', color: '#9B1C1C' },
  confirmDesc: { fontSize: 13, color: '#7F1D1D', marginTop: 6, lineHeight: 19 },
  motivoChip: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  motivoChipLabel: {
    fontSize: 10,
    color: '#9099B3',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  motivoChipValue: { fontSize: 14, color: '#000933', fontWeight: '700', marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  btnSecundario: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    alignItems: 'center',
  },
  btnSecundarioTxt: { fontSize: 14, fontWeight: '700', color: '#000933' },
  btnConfirmar: {
    flex: 1.5,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#9B1C1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnConfirmarTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
