import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors } from '../../../../../theme';
import { useTheme } from '../../../../../shared/hooks';

export function SolicitacaoPrecoModal({
  visible,
  precoSolicitado,
  justificativa,
  enviando,
  onChangePreco,
  onChangeJustificativa,
  onEnviar,
  onClose,
}: {
  visible: boolean;
  precoSolicitado: string;
  justificativa: string;
  enviando: boolean;
  onChangePreco: (v: string) => void;
  onChangeJustificativa: (v: string) => void;
  onEnviar: () => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const inp = { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.modalSheet, { backgroundColor: theme.surf }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
          <Text style={[styles.modalTitle, { color: theme.text }]}>Solicitar mudança de preço</Text>
          <Text style={[styles.modalSub, { color: theme.textMut }]}>
            Informe o novo preço e a justificativa. Um admin/gerente irá revisar sua solicitação.
          </Text>
          <Text style={[styles.solModalLabel, { color: theme.textSec }]}>NOVO PREÇO (R$)</Text>
          <TextInput
            style={[styles.solModalInput, inp]}
            value={precoSolicitado}
            placeholderTextColor={theme.textMut}
            onChangeText={onChangePreco}
            placeholder="0,00"
            keyboardType="decimal-pad"
          />
          <Text style={[styles.solModalLabel, { color: theme.textSec, marginTop: 12 }]}>
            JUSTIFICATIVA
          </Text>
          <TextInput
            style={[styles.solModalInput, inp, { minHeight: 70, textAlignVertical: 'top' }]}
            value={justificativa}
            onChangeText={onChangeJustificativa}
            placeholder="Explique o motivo da mudança de preço..."
            placeholderTextColor={theme.textMut}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={[styles.saveBtn, { marginTop: 16 }, enviando && { opacity: 0.7 }]}
            onPress={onEnviar}
            disabled={enviando}
          >
            {enviando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Enviar solicitação</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              {
                backgroundColor: 'transparent',
                borderWidth: 1.5,
                borderColor: theme.border,
                marginTop: 8,
              },
            ]}
            onPress={onClose}
          >
            <Text style={[styles.saveBtnText, { color: theme.textSec }]}>Cancelar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,9,51,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.n0,
    borderRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.n200,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.navy, marginBottom: 6 },
  modalSub: { fontSize: 13, color: colors.n600, lineHeight: 19, marginBottom: 16 },
  solModalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  solModalInput: {
    backgroundColor: colors.n50,
    borderWidth: 1.5,
    borderColor: colors.n200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.navy,
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
