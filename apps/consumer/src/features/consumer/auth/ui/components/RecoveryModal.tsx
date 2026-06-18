import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';
import { formatCPF } from '../../lib/formatCPF';
import { useRecoveryForm } from '../../model/useRecoveryForm';

interface RecoveryModalProps {
  visible: boolean;
  onClose: () => void;
}

export function RecoveryModal({ visible, onClose }: RecoveryModalProps) {
  const {
    step,
    setStep,
    cpf,
    setCpf,
    codigo,
    setCodigo,
    novaSenha,
    setNovaSenha,
    confirmar,
    setConfirmar,
    showNovaSenha,
    setShowNovaSenha,
    showConfirmar,
    setShowConfirmar,
    loading,
    error,
    setError,
    handleClose,
    handleEnviarCodigo,
    handleVerificarCodigo,
    handleRedefinirSenha,
  } = useRecoveryForm(onClose);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.modalOverlay} onPress={handleClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHandle} />

          {/* ETAPA 1 — CPF */}
          {step === 'form' && (
            <>
              <Text style={styles.modalTitle}>Recuperar senha</Text>
              <Text style={styles.modalSub}>
                Informe seu CPF cadastrado. Enviaremos um código de 6 dígitos para o email associado
                à sua conta.
              </Text>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>CPF</Text>
                <TextInput
                  style={[styles.fieldInput, error ? styles.fieldInputError : undefined]}
                  value={cpf}
                  onChangeText={(v) => {
                    setCpf(formatCPF(v));
                    setError('');
                  }}
                  placeholder="000.000.000-00"
                  placeholderTextColor={colors.n600}
                  keyboardType="numeric"
                />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </View>
              <TouchableOpacity
                style={[styles.modalBtn, loading && { opacity: 0.7 }]}
                onPress={handleEnviarCodigo}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalBtnText}>Enviar código</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ETAPA 2 — CÓDIGO */}
          {step === 'codigo' && (
            <>
              <Text style={styles.modalTitle}>Digite o código</Text>
              <Text style={styles.modalSub}>
                Enviamos um código de 6 dígitos para o email cadastrado no CPF{' '}
                <Text style={{ fontWeight: '700', color: colors.navy }}>{cpf}</Text>.{'\n'}
                Verifique sua caixa de entrada.
              </Text>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Código</Text>
                <TextInput
                  style={[styles.fieldInput, error ? styles.fieldInputError : undefined]}
                  value={codigo}
                  onChangeText={(v) => {
                    setCodigo(v.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  placeholder="000000"
                  placeholderTextColor={colors.n600}
                  keyboardType="numeric"
                  maxLength={6}
                />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </View>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={handleVerificarCodigo}
                activeOpacity={0.85}
              >
                <Text style={styles.modalBtnText}>Continuar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setStep('form');
                  setError('');
                  setCodigo('');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Reenviar código</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ETAPA 3 — NOVA SENHA */}
          {step === 'senha' && (
            <>
              <Text style={styles.modalTitle}>Nova senha</Text>
              <Text style={styles.modalSub}>
                Crie uma nova senha com pelo menos 8 caracteres, 1 maiúscula e 1 número.
              </Text>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Nova senha</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[
                      styles.fieldInput,
                      styles.fieldInputFlex,
                      error ? styles.fieldInputError : undefined,
                    ]}
                    value={novaSenha}
                    onChangeText={(v) => {
                      setNovaSenha(v);
                      setError('');
                    }}
                    placeholder="••••••••"
                    placeholderTextColor={colors.n600}
                    secureTextEntry={!showNovaSenha}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowNovaSenha((v) => !v)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showNovaSenha ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.n600}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Confirmar senha</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[
                      styles.fieldInput,
                      styles.fieldInputFlex,
                      error ? styles.fieldInputError : undefined,
                    ]}
                    value={confirmar}
                    onChangeText={(v) => {
                      setConfirmar(v);
                      setError('');
                    }}
                    placeholder="••••••••"
                    placeholderTextColor={colors.n600}
                    secureTextEntry={!showConfirmar}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowConfirmar((v) => !v)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showConfirmar ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.n600}
                    />
                  </TouchableOpacity>
                </View>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </View>
              <TouchableOpacity
                style={[styles.modalBtn, loading && { opacity: 0.7 }]}
                onPress={handleRedefinirSenha}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalBtnText}>Redefinir senha</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setStep('codigo');
                  setError('');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Voltar</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ETAPA 4 — SUCESSO */}
          {step === 'success' && (
            <>
              <View style={styles.successIconWrap}>
                <Ionicons name="checkmark" size={32} color="#046C2E" />
              </View>
              <Text style={styles.successTitle}>Senha redefinida!</Text>
              <Text style={styles.successSub}>
                Sua senha foi atualizada com sucesso.{'\n'}
                Faça login com sua nova senha.
              </Text>
              <View style={styles.successBanner}>
                <Ionicons name="checkmark" size={16} color="#046C2E" />
                <Text style={styles.successBannerText}>Senha atualizada com sucesso!</Text>
              </View>
              <TouchableOpacity style={styles.modalBtn} onPress={handleClose} activeOpacity={0.85}>
                <Text style={styles.modalBtnText}>Voltar ao login</Text>
              </TouchableOpacity>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,9,51,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.n0,
    borderRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 28,
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
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.navy, marginBottom: 6 },
  modalSub: { fontSize: 13, color: colors.n600, marginBottom: 20, lineHeight: 19 },

  field: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 5,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  fieldInputFlex: { flex: 1 },
  eyeBtn: { position: 'absolute', right: 12, height: 46, justifyContent: 'center' },
  fieldInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.n200,
    backgroundColor: colors.n50,
    paddingHorizontal: 14,
    paddingRight: 42,
    fontSize: 14,
    color: colors.navy,
  },
  fieldInputError: { borderColor: '#E24B4A' },
  errorText: { fontSize: 11, color: '#E24B4A', marginTop: 4, fontWeight: '500' },

  modalBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  modalBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  modalCancelBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.n200,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: colors.n600 },

  successIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(57,255,137,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 10,
  },
  successSub: {
    fontSize: 13,
    color: colors.n600,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(57,255,137,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(4,108,46,0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successBannerText: { fontSize: 13, fontWeight: '600', color: '#046C2E' },
});
