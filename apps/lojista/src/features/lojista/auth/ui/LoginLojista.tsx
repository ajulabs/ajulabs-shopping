import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, AjuLogo } from '@ajulabs/theme';
import { useAuthLojistaStore } from '../model/store';
import { enrichRateLimit } from '../../../../utils/enrichRateLimit';

const API_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '') + '/v1/';

interface LoginLojistaProps {
  onLoginSuccess?: () => void;
}

type RecoveryStep = 'form' | 'codigo' | 'senha' | 'success';

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
}) {
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
        <TextInput
          style={styles.inputInner}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.n600}
          secureTextEntry={secureTextEntry && !shown}
          keyboardType={keyboardType}
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShown((s) => !s)} hitSlop={10} style={styles.eyeBtn}>
            <Ionicons
              name={shown ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.n600}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function RecoveryModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [step, setStep] = useState<RecoveryStep>('form');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = useCallback(() => {
    setStep('form');
    setEmail('');
    setCodigo('');
    setNovaSenha('');
    setConfirmar('');
    setShowNovaSenha(false);
    setShowConfirmar(false);
    setError('');
    onClose();
  }, [onClose]);

  const handleEnviarCodigo = useCallback(async () => {
    if (!email.includes('@') || !email.includes('.')) {
      setError('Email inválido.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}auth/lojista/recuperar-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === 'string' ? data.error : 'Erro ao enviar código.');
      }
      setStep('codigo');
    } catch (err) {
      const isNetwork =
        err instanceof Error &&
        (err.message.includes('Network') ||
          err.message.includes('fetch') ||
          err.message.includes('Failed'));
      setError(
        enrichRateLimit(
          isNetwork
            ? 'Sem conexão. Verifique sua internet.'
            : err instanceof Error
              ? err.message
              : 'Erro ao enviar.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [email]);

  const handleVerificarCodigo = useCallback(() => {
    if (codigo.length !== 6) {
      setError('Digite o código de 6 dígitos enviado ao seu email.');
      return;
    }
    setError('');
    setStep('senha');
  }, [codigo]);

  const handleRedefinirSenha = useCallback(async () => {
    if (novaSenha.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (!/[A-Z]/.test(novaSenha)) {
      setError('A senha deve conter pelo menos 1 letra maiúscula.');
      return;
    }
    if (!/[0-9]/.test(novaSenha)) {
      setError('A senha deve conter pelo menos 1 número.');
      return;
    }
    if (novaSenha !== confirmar) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}auth/lojista/redefinir-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo, novaSenha }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === 'string' ? data.error : 'Erro ao redefinir senha.');
      }
      setStep('success');
    } catch (err) {
      const isNetwork =
        err instanceof Error &&
        (err.message.includes('Network') ||
          err.message.includes('fetch') ||
          err.message.includes('Failed'));
      setError(
        enrichRateLimit(
          isNetwork
            ? 'Sem conexão. Verifique sua internet.'
            : err instanceof Error
              ? err.message
              : 'Erro ao redefinir senha.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [email, codigo, novaSenha, confirmar]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.modalOverlay} onPress={handleClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHandle} />

          {/* ETAPA 1 — EMAIL */}
          {step === 'form' && (
            <>
              <Text style={styles.modalTitle}>Recuperar senha</Text>
              <Text style={styles.modalSub}>
                Informe o email cadastrado na sua conta. Enviaremos um código de verificação.
              </Text>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>EMAIL CADASTRADO</Text>
                <TextInput
                  style={[styles.fieldInput, error ? styles.fieldInputError : undefined]}
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setError('');
                  }}
                  placeholder="loja@email.com"
                  placeholderTextColor={colors.n600}
                  keyboardType="email-address"
                  autoCapitalize="none"
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
                Enviamos um código de 6 dígitos para{' '}
                <Text style={{ fontWeight: '700', color: colors.navy }}>{email}</Text>.{'\n'}
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
                <View style={styles.pwRow}>
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
                    style={styles.eyeBtnAbs}
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
                <View style={styles.pwRow}>
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
                    style={styles.eyeBtnAbs}
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
                Sua senha foi atualizada com sucesso.{'\n'}Faça login com sua nova senha.
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

export function LoginLojista({ onLoginSuccess }: LoginLojistaProps) {
  const router = useRouter();
  const login = useAuthLojistaStore((s) => s.login);
  const [cnpj, setCnpj] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = useCallback(async () => {
    if (!cnpj.trim() || !senha.trim()) {
      setError('Preencha todos os campos.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(cnpj, senha);
      onLoginSuccess?.();
      router.replace('/(lojista)/pedidos');
    } catch (err) {
      const isNetwork =
        err instanceof Error &&
        (err.message.includes('Network') ||
          err.message.includes('fetch') ||
          err.message.includes('Failed'));
      const msg = isNetwork
        ? 'Sem conexão com o servidor. Verifique sua internet.'
        : err instanceof Error
          ? err.message
          : 'CNPJ ou senha incorretos. Tente novamente.';
      setError(enrichRateLimit(msg));
    } finally {
      setLoading(false);
    }
  }, [cnpj, senha, login, onLoginSuccess, router]);

  return (
    <View style={styles.container}>
      {/* Topo navy */}
      <View style={styles.top}>
        <View style={{ marginBottom: 16 }}>
          <AjuLogo size={52} />
        </View>
        <Text style={styles.topTitle}>Portal do Lojista</Text>
        <Text style={styles.topSub}>Venda no Shopping Digital em minutos.</Text>
      </View>

      {/* Card branco */}
      <ScrollView
        style={styles.card}
        contentContainerStyle={styles.cardContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.cardTitle}>Entrar</Text>
        <Text style={styles.cardSub}>Use seu CNPJ cadastrado</Text>

        <Field
          label="CNPJ"
          value={cnpj}
          onChange={(v) => {
            setCnpj(formatCNPJ(v));
            setError('');
          }}
          placeholder="00.000.000/0001-00"
          keyboardType="numeric"
        />
        <Field
          label="SENHA"
          value={senha}
          onChange={(v) => {
            setSenha(v);
            setError('');
          }}
          placeholder="••••••••"
          secureTextEntry
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.forgotRow}
          onPress={() => setShowRecovery(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.forgotText}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Entrar no painel</Text>
          )}
        </TouchableOpacity>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Primeira vez? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.8}>
            <Text style={styles.registerLink}>Cadastre sua loja</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.colaboradorRow}>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/colaborador-login')}
            activeOpacity={0.8}
          >
            <Text style={styles.colaboradorLink}>Entrar como colaborador</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          by <Text style={styles.footerBrand}>AjuLabs</Text>
        </Text>
      </View>

      {/* Modal recuperação */}
      <RecoveryModal visible={showRecovery} onClose={() => setShowRecovery(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navy },

  // Topo
  top: { paddingTop: 52, paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
  topTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  topSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 6 },

  // Card
  card: {
    backgroundColor: colors.n0,
    borderRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  cardContent: { padding: 28, paddingBottom: 0 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: colors.navy },
  cardSub: { fontSize: 13, color: colors.n600, marginTop: 4, marginBottom: 22 },

  // Campos
  field: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 5,
  },
  inputRow: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.n200,
    backgroundColor: colors.n50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  inputRowFocused: { borderColor: colors.orange },
  inputInner: { flex: 1, fontSize: 14, color: colors.navy },
  eyeBtn: { paddingLeft: 8 },
  fieldInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.n200,
    backgroundColor: colors.n50,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.navy,
  },
  fieldInputFocused: { borderColor: colors.orange },
  fieldInputError: { borderColor: '#E24B4A' },
  errorText: { fontSize: 11, color: '#E24B4A', marginTop: 4, fontWeight: '500' },

  // Esqueci
  forgotRow: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 16 },
  forgotText: { fontSize: 13, color: colors.orange600, fontWeight: '600' },

  // Submit
  submitBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Register
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  registerText: { fontSize: 13, color: colors.n600 },
  registerLink: { fontSize: 13, fontWeight: '600', color: colors.orange600 },

  // Colaborador
  colaboradorRow: { alignItems: 'center', marginTop: 12 },
  colaboradorLink: { fontSize: 13, fontWeight: '600', color: colors.navy, opacity: 0.55 },

  // Footer
  footer: { paddingVertical: 16, alignItems: 'center', backgroundColor: colors.navy },
  footerText: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  footerBrand: { color: 'rgba(255,255,255,0.65)', fontWeight: '600' },

  // Modal
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

  // Opções de método
  methodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.n200,
    marginBottom: 10,
  },
  methodBtnSelected: { borderColor: colors.orange, backgroundColor: colors.orange100 },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.n100,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  methodInfo: { flex: 1 },
  methodTitle: { fontSize: 14, fontWeight: '600', color: colors.navy },
  methodSubText: { fontSize: 11, color: colors.n600, marginTop: 2 },
  methodRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.n200,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  methodRadioSelected: { borderColor: colors.orange, backgroundColor: colors.orange },
  methodRadioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },

  // Botões do modal
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

  // Sucesso
  pwRow: { flexDirection: 'row', alignItems: 'center' },
  fieldInputFlex: { flex: 1 },
  eyeBtnAbs: { position: 'absolute', right: 12, height: 46, justifyContent: 'center' },
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
  successIcon: { fontSize: 32, color: '#046C2E' },
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
  successEmail: { fontWeight: '700', color: colors.navy },
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
  successBannerIcon: { fontSize: 16, color: '#046C2E', fontWeight: '700' },
  successBannerText: { fontSize: 13, fontWeight: '600', color: '#046C2E' },
});
