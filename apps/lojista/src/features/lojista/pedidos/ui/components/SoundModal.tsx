import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../../shared/hooks';
import { SONS, type SomTipo } from '../../model/usePedidoSound';

interface Props {
  visible: boolean;
  somAtual: SomTipo;
  onClose: () => void;
  onSelect: (id: SomTipo) => void;
}

export function SoundModal({ visible, somAtual, onClose, onSelect }: Props) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={[s.modalBox, { backgroundColor: theme.surf }]}>
          <View style={s.modalHeader}>
            <Text style={[s.modalTitulo, { color: theme.text }]}>Som de notificação</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>
          <Text style={[s.modalSub, { color: theme.textMut }]}>
            Toque em cada opção para ouvir um preview
          </Text>
          {SONS.map((som) => (
            <TouchableOpacity
              key={som.id}
              style={[
                s.somItem,
                { borderColor: theme.border },
                somAtual === som.id && s.somItemAtivo,
              ]}
              onPress={() => onSelect(som.id)}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    s.somLabel,
                    { color: theme.text },
                    somAtual === som.id && { color: '#DE6708' },
                  ]}
                >
                  {som.label}
                </Text>
                <Text style={[s.somDesc, { color: theme.textMut }]}>{som.descricao}</Text>
              </View>
              {somAtual === som.id && (
                <Ionicons name="checkmark-circle" size={22} color="#DE6708" />
              )}
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
  somItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    marginBottom: 10,
  },
  somItemAtivo: { borderColor: '#DE6708', backgroundColor: '#FFF5EE' },
  somLabel: { fontSize: 14, fontWeight: '700', color: '#000933' },
  somDesc: { fontSize: 12, color: '#9099B3', marginTop: 2 },
});
