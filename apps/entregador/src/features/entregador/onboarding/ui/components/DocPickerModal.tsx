import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DocPickerModalProps {
  docModal: 'frente' | 'verso' | null;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
}

export function DocPickerModal({ docModal, onClose, onCamera, onGallery }: DocPickerModalProps) {
  return (
    <Modal visible={docModal !== null} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={s.modalSheet}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>
            {docModal === 'frente' ? 'Frente do documento' : 'Verso do documento'}
          </Text>
          <Text style={s.modalSub}>Escolha como deseja enviar a foto</Text>

          <TouchableOpacity style={s.modalOption} activeOpacity={0.8} onPress={onCamera}>
            <View style={s.modalOptionIcon}>
              <Ionicons name="camera" size={24} color="#F2760F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.modalOptionTitle}>Tirar foto</Text>
              <Text style={s.modalOptionSub}>Abrir câmera do celular</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9099B3" />
          </TouchableOpacity>

          <TouchableOpacity style={s.modalOption} activeOpacity={0.8} onPress={onGallery}>
            <View style={s.modalOptionIcon}>
              <Ionicons name="images" size={24} color="#F2760F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.modalOptionTitle}>Escolher da galeria</Text>
              <Text style={s.modalOptionSub}>Selecionar foto existente</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9099B3" />
          </TouchableOpacity>

          <TouchableOpacity style={s.modalCancel} onPress={onClose} activeOpacity={0.8}>
            <Text style={s.modalCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: '#E4E7F1',
    alignSelf: 'center',
    marginBottom: 18,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#000933', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#9099B3', marginBottom: 20 },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    backgroundColor: '#F6F7FB',
    marginBottom: 10,
  },
  modalOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEF0E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionTitle: { fontSize: 15, fontWeight: '600', color: '#000933' },
  modalOptionSub: { fontSize: 12, color: '#9099B3', marginTop: 2 },
  modalCancel: {
    marginTop: 6,
    padding: 14,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: '#9099B3' },
});
