import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function DiscardModal({
  visible,
  onRequestClose,
  onDiscard,
  onCancel,
}: {
  visible: boolean;
  onRequestClose: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalBox}>
          <View style={[s.modalIconWrap, { backgroundColor: 'rgba(225,75,60,0.1)' }]}>
            <Ionicons name="warning-outline" size={36} color="#E14B3C" />
          </View>
          <Text style={s.modalTitle}>Alterações não salvas</Text>
          <Text style={s.modalMsg}>
            Você tem alterações que ainda não foram salvas. Deseja descartá-las?
          </Text>
          <TouchableOpacity style={s.modalBtnDanger} onPress={onDiscard} activeOpacity={0.85}>
            <Text style={s.modalBtnDangerTxt}>Descartar e sair</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.modalBtnCancel} onPress={onCancel} activeOpacity={0.85}>
            <Text style={s.modalBtnCancelTxt}>Continuar editando</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function SuccessModal({ visible }: { visible: boolean }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.modalOverlay}>
        <View style={s.modalBox}>
          <View style={s.modalIconWrap}>
            <Ionicons name="checkmark-circle" size={40} color="#039855" />
          </View>
          <Text style={s.modalTitle}>Endereço salvo!</Text>
          <Text style={s.modalMsg}>Sua localização foi salva ou editada com sucesso.</Text>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(3,152,85,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#000933', marginBottom: 8 },
  modalMsg: { fontSize: 13, color: '#9099B3', textAlign: 'center', lineHeight: 19 },
  modalBtnDanger: {
    width: '100%',
    backgroundColor: '#E14B3C',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  modalBtnDangerTxt: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  modalBtnCancel: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  modalBtnCancelTxt: { fontSize: 15, fontWeight: '600', color: '#000933' },
});
