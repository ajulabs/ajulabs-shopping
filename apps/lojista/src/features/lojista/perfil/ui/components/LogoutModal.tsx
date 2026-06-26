import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../../shared/hooks';

export function LogoutModal({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { backgroundColor: theme.surf }]}>
          <View style={styles.modalIconWrap}>
            <Ionicons name="log-out-outline" size={28} color="#E24B4A" />
          </View>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Sair da conta</Text>
          <Text style={[styles.modalMsg, { color: theme.textSec }]}>
            Tem certeza que deseja sair? Você precisará fazer login novamente para acessar sua
            conta.
          </Text>
          <TouchableOpacity style={styles.modalBtnSair} onPress={onConfirm} activeOpacity={0.85}>
            <Text style={styles.modalBtnSairText}>Sim, quero sair</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalBtnCancel, { borderColor: theme.border }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={[styles.modalBtnCancelText, { color: theme.textSec }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(226,75,74,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#000933', marginBottom: 8 },
  modalMsg: {
    fontSize: 14,
    color: '#5A6480',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  modalBtnSair: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: '#E24B4A',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalBtnSairText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  modalBtnCancel: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    alignItems: 'center',
  },
  modalBtnCancelText: { fontSize: 15, fontWeight: '600', color: '#5A6480' },
});
