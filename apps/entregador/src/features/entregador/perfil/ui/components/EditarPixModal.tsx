import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PIX_TIPOS, type PixTipo } from '../../model/useDadosBancarios';

interface EditarPixModalProps {
  visible: boolean;
  onClose: () => void;
  pixTipo: PixTipo;
  setPixTipo: (tipo: PixTipo) => void;
  pixValor: string;
  setPixValor: (v: string) => void;
  pixFocused: boolean;
  setPixFocused: (v: boolean) => void;
  saving: boolean;
  tipoSel: { id: PixTipo; label: string; placeholder: string; keyboard: any };
  onChangePix: (v: string) => void;
  onSalvar: () => void;
}

export function EditarPixModal({
  visible,
  onClose,
  pixTipo,
  setPixTipo,
  pixValor,
  setPixValor,
  pixFocused,
  setPixFocused,
  saving,
  tipoSel,
  onChangePix,
  onSalvar,
}: EditarPixModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={s.modalSheet}>
          <View style={s.modalHandle} />

          <View style={s.pixHint}>
            <Ionicons name="flash" size={18} color="#046C2E" />
            <View>
              <Text style={s.pixHintTitle}>Chave Pix</Text>
              <Text style={s.pixHintSub}>Saque instantâneo, sem taxa</Text>
            </View>
          </View>

          <Text style={s.modalFieldLabel}>Tipo de chave</Text>
          <View style={s.tipoRow}>
            {PIX_TIPOS.map((t) => {
              const ativo = pixTipo === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[s.tipoBtn, ativo && s.tipoBtnActive]}
                  onPress={() => {
                    setPixTipo(t.id);
                    setPixValor('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[s.tipoBtnText, ativo && s.tipoBtnTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[s.modalFieldLabel, { marginTop: 14 }]}>Chave Pix</Text>
          <View style={[s.pixInput, pixFocused && s.pixInputFocused]}>
            <TextInput
              value={pixValor}
              onChangeText={onChangePix}
              placeholder={tipoSel.placeholder}
              placeholderTextColor="#9099B3"
              keyboardType={tipoSel.keyboard}
              autoCapitalize="none"
              autoFocus
              style={s.pixInputInner}
              onFocus={() => setPixFocused(true)}
              onBlur={() => setPixFocused(false)}
            />
            {pixValor.length > 0 && (
              <TouchableOpacity onPress={() => setPixValor('')} hitSlop={10}>
                <Ionicons name="close-circle" size={18} color="#9099B3" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.7 }]}
            onPress={onSalvar}
            activeOpacity={0.85}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="flash" size={15} color="#FFFFFF" />
                <Text style={s.saveBtnText}>Salvar chave Pix</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={s.cancelBtnText}>Cancelar</Text>
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
    marginBottom: 20,
  },
  modalFieldLabel: { fontSize: 12, fontWeight: '600', color: '#2A3156', marginBottom: 8 },

  pixHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: 'rgba(57,255,137,0.15)',
    borderRadius: 12,
    marginBottom: 18,
  },
  pixHintTitle: { fontSize: 13, fontWeight: '700', color: '#046C2E' },
  pixHintSub: { fontSize: 11, color: '#046C2E', opacity: 0.85 },

  tipoRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tipoBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    backgroundColor: '#F6F7FB',
  },
  tipoBtnActive: { borderColor: '#F2760F', backgroundColor: 'rgba(242,118,15,0.08)' },
  tipoBtnText: { fontSize: 13, fontWeight: '600', color: '#9099B3' },
  tipoBtnTextActive: { color: '#F2760F' },

  pixInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    backgroundColor: '#F6F7FB',
  },
  pixInputFocused: { borderColor: '#F2760F' },
  pixInputInner: { flex: 1, fontSize: 15, color: '#000933' },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F2760F',
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 18,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  cancelBtn: {
    marginTop: 10,
    padding: 14,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#9099B3' },
});
