import { View, Text, TouchableOpacity, StyleSheet, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../../shared/hooks';

interface PhotoModalProps {
  visible: boolean;
  fotoPerfil: string | null;
  onClose: () => void;
  onTrocarFoto: () => void;
}

export function PhotoModal({ visible, fotoPerfil, onClose, onTrocarFoto }: PhotoModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.photoOverlay}>
        <TouchableOpacity style={s.photoClose} onPress={onClose} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        {fotoPerfil && (
          <Image source={{ uri: fotoPerfil }} style={s.photoFull} resizeMode="contain" />
        )}
        <TouchableOpacity
          style={s.photoTrocarBtn}
          onPress={() => {
            onClose();
            onTrocarFoto();
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="camera" size={16} color="#FFFFFF" />
          <Text style={s.photoTrocarText}>Trocar foto</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

interface LogoutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutModal({ visible, onClose, onConfirm }: LogoutModalProps) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={[s.modalBox, { backgroundColor: theme.surf }]}>
          <View style={s.modalIconWrap}>
            <Ionicons name="log-out-outline" size={28} color="#E14B3C" />
          </View>
          <Text style={[s.modalTitle, { color: theme.text }]}>Sair da conta</Text>
          <Text style={[s.modalMsg, { color: theme.textMut }]}>
            Tem certeza que deseja sair da sua conta?
          </Text>
          <TouchableOpacity style={s.modalBtnSair} onPress={onConfirm} activeOpacity={0.8}>
            <Text style={s.modalBtnSairText}>Sim, quero sair</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.modalBtnCancel, { borderColor: theme.border }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={[s.modalBtnCancelText, { color: theme.text }]}>Cancelar</Text>
          </TouchableOpacity>
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
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FDECEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#000933', marginBottom: 6 },
  modalMsg: {
    fontSize: 13,
    color: '#9099B3',
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 19,
  },
  modalBtnSair: {
    width: '100%',
    backgroundColor: '#E14B3C',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalBtnSairText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  modalBtnCancel: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  modalBtnCancelText: { fontSize: 14, fontWeight: '600', color: '#000933' },
  photoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoClose: {
    position: 'absolute',
    top: 52,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  photoFull: {
    width: '100%',
    height: '65%',
  },
  photoTrocarBtn: {
    position: 'absolute',
    bottom: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F2760F',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 30,
  },
  photoTrocarText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
