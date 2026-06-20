import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOTIVOS_CANCELAMENTO, type OrderStatus } from '../../lib';

interface Props {
  data: { orderId: string; dbId: string; status: OrderStatus } | null;
  onClose: () => void;
  onConfirm: (dbId: string, motivo: string) => void;
}

export function CancelModal({ data, onClose, onConfirm }: Props) {
  if (!data) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalBox}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitulo}>Cancelar pedido</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#000933" />
            </TouchableOpacity>
          </View>
          <Text style={s.modalSub}>{data.orderId}</Text>
          {['preparando', 'pronto'].includes(data.status) && (
            <View style={s.penaltyWarn}>
              <Ionicons name="warning-outline" size={14} color="#B45309" />
              <Text style={s.penaltyTxt}>
                Cancelar após aceitar o pedido conta como penalidade e afeta o ranqueamento da loja.
              </Text>
            </View>
          )}
          <Text style={[s.modalSub, { marginTop: 14, marginBottom: 12 }]}>Selecione o motivo:</Text>
          {MOTIVOS_CANCELAMENTO.map((m) => (
            <TouchableOpacity
              key={m.value}
              style={s.motivoItem}
              onPress={() => onConfirm(data.dbId, m.value)}
              activeOpacity={0.8}
            >
              <Text style={s.motivoLabel}>{m.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#9099B3" />
            </TouchableOpacity>
          ))}
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
});
