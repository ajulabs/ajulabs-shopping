import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, AjuLogo } from '@ajulabs/theme';
import { useAuthEntregadorStore } from '../../../../store';
import { formatCPF } from '../lib/formatCPF';
import { Field } from './components/Field';
import { enrichRateLimit } from '../../../../utils/enrichRateLimit';

const API_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '') + '/v1/';

type RecoveryStep = 'form' | 'codigo' | 'senha' | 'success';

function RecoveryModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [step, setStep] = useState<RecoveryStep>('form');
  const [cpf, setCpf] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = useCallback(() => {
    setStep('form');
    setCpf('');
    setCodigo('');
    setNovaSenha('');
    setConfirmar('');
    setShowNovaSenha(false);
    setShowConfirmar(false);
    setError('');
    onClose();
  }, [onClose]);

  const handleEnviarCodigo = useCallback(async () => {
    if (cpf.replace(/\D/g, '').length !== 11) {
      setError('CPF inválido — deve ter 11 dígitos.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}auth/entregador/recuperar-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpf.replace(/\D/g, '') }),
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
  }, [cpf]);

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
      const res = await fetch(`${API_URL}auth/entregador/redefinir-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpf.replace(/\D/g, ''), codigo, novaSenha }),
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
  }, [cpf, codigo, novaSenha, confirmar]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={rs.overlay} onPress={handleClose}>
        <Pressable style={rs.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={rs.handle} />

          {step === 'form' && (
            <>
              <Text style={rs.title}>Recuperar senha</Text>
              <Text style={rs.sub}>
                Informe seu CPF cadastrado. Enviaremos um código para o email da sua conta.
              </Text>
              <View style={rs.field}>
                <Text style={rs.label}>CPF</Text>
                <TextInput
                  style={[rs.input, error ? rs.inputError : undefined]}
                  value={cpf}
                  onChangeText={(v) => {
                    setCpf(formatCPF(v));
                    setError('');
                  }}
                  placeholder="000.000.000-00"
                  placeholderTextColor={colors.n600}
                  keyboardType="numeric"
                />
                {error ? <Text style={rs.errorText}>{error}</Text> : null}
              </View>
              <TouchableOpacity
                style={[rs.btn, loading && { opacity: 0.7 }]}
                onPress={handleEnviarCodigo}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={rs.btnText}>Enviar código</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={rs.cancelBtn} onPress={handleClose} activeOpacity={0.8}>
                <Text style={rs.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'codigo' && (
            <>
              <Text style={rs.title}>Digite o código</Text>
              <Text style={rs.sub}>
                Enviamos um código de 6 dígitos para o email cadastrado no CPF{' '}
                <Text style={{ fontWeight: '700', color: colors.navy }}>{cpf}</Text>.
              </Text>
              <View style={rs.field}>
                <Text style={rs.label}>Código</Text>
                <TextInput
                  style={[rs.input, error ? rs.inputError : undefined]}
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
                {error ? <Text style={rs.errorText}>{error}</Text> : null}
              </View>
              <TouchableOpacity style={rs.btn} onPress={handleVerificarCodigo} activeOpacity={0.85}>
                <Text style={rs.btnText}>Continuar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={rs.cancelBtn}
                onPress={() => {
                  setStep('form');
                  setError('');
                  setCodigo('');
                }}
                activeOpacity={0.8}
              >
                <Text style={rs.cancelText}>Reenviar código</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'senha' && (
            <>
              <Text style={rs.title}>Nova senha</Text>
              <Text style={rs.sub}>
                Crie uma nova senha com pelo menos 8 caracteres, 1 maiúscula e 1 número.
              </Text>
              <View style={rs.field}>
                <Text style={rs.label}>Nova senha</Text>
                <View style={rs.pwRow}>
                  <TextInput
                    style={[rs.input, rs.inputFlex, error ? rs.inputError : undefined]}
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
                    style={rs.eyeBtn}
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
              <View style={rs.field}>
                <Text style={rs.label}>Confirmar senha</Text>
                <View style={rs.pwRow}>
                  <TextInput
                    style={[rs.input, rs.inputFlex, error ? rs.inputError : undefined]}
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
                    style={rs.eyeBtn}
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
                {error ? <Text style={rs.errorText}>{error}</Text> : null}
              </View>
              <TouchableOpacity
                style={[rs.btn, loading && { opacity: 0.7 }]}
                onPress={handleRedefinirSenha}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={rs.btnText}>Redefinir senha</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={rs.cancelBtn}
                onPress={() => {
                  setStep('codigo');
                  setError('');
                }}
                activeOpacity={0.8}
              >
                <Text style={rs.cancelText}>Voltar</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'success' && (
            <>
              <View style={rs.successIcon}>
                <Ionicons name="checkmark" size={32} color="#046C2E" />
              </View>
              <Text style={rs.successTitle}>Senha redefinida!</Text>
              <Text style={rs.successSub}>
                Sua senha foi atualizada com sucesso.{'\n'}Faça login com sua nova senha.
              </Text>
              <View style={rs.successBanner}>
                <Ionicons name="checkmark" size={16} color="#046C2E" />
                <Text style={rs.successBannerText}>Senha atualizada com sucesso!</Text>
              </View>
              <TouchableOpacity style={rs.btn} onPress={handleClose} activeOpacity={0.85}>
                <Text style={rs.btnText}>Voltar ao login</Text>
              </TouchableOpacity>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const rs = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,9,51,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.n0,
    borderRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 28,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.n200,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.navy, marginBottom: 6 },
  sub: { fontSize: 13, color: colors.n600, marginBottom: 20, lineHeight: 19 },
  field: { marginBottom: 14 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 5,
  },
  input: {
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
  inputFlex: { flex: 1 },
  inputError: { borderColor: '#E24B4A' },
  errorText: { fontSize: 11, color: '#E24B4A', marginTop: 4, fontWeight: '500' },
  pwRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { position: 'absolute', right: 12, height: 46, justifyContent: 'center' },
  btn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cancelBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.n200,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  cancelText: { fontSize: 14, fontWeight: '600', color: colors.n600 },
  successIcon: {
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

interface LoginEntregadorProps {
  onLoginSuccess?: () => void;
}

export function LoginEntregador({ onLoginSuccess }: LoginEntregadorProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const login = useAuthEntregadorStore((s) => s.login);
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);

  const handleLogin = useCallback(async () => {
    if (!cpf.trim() || !senha.trim()) {
      setError('Preencha todos os campos.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(cpf, senha);
      onLoginSuccess?.();
      router.replace('/');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      const isNetwork = msg.includes('Network') || msg.includes('fetch') || msg.includes('Failed');
      setError(
        enrichRateLimit(
          isNetwork
            ? 'Sem conexão com o servidor. Verifique sua internet.'
            : msg || 'CPF ou senha incorretos. Tente novamente.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [cpf, senha, login, onLoginSuccess, router]);

  return (
    <View style={styles.container}>
      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <View style={{ marginBottom: 16 }}>
          <AjuLogo size={52} />
        </View>
        <Text style={styles.topTitle}>AjuLabs Entregador</Text>
        <Text style={styles.topSub}>Entregue com agilidade em Aracaju.</Text>
      </View>

      <ScrollView
        style={styles.card}
        contentContainerStyle={styles.cardContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.cardTitle}>Entrar</Text>
        <Text style={styles.cardSub}>Use seu CPF cadastrado</Text>

        <Field
          label="CPF"
          value={cpf}
          onChange={(v) => {
            setCpf(formatCPF(v));
            setError('');
          }}
          placeholder="000.000.000-00"
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
            <Text style={styles.submitBtnText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Primeira vez? </Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/cadastro' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.registerLink}>Criar conta</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          by <Text style={styles.footerBrand}>AjuLabs</Text>
        </Text>
      </View>

      <RecoveryModal visible={showRecovery} onClose={() => setShowRecovery(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navy },

  top: { paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
  topTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  topSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 6 },

  card: {
    backgroundColor: colors.n0,
    borderRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  cardContent: { padding: 28, paddingBottom: 0 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: colors.navy },
  cardSub: { fontSize: 13, color: colors.n600, marginTop: 4, marginBottom: 22 },

  errorText: { fontSize: 11, color: '#E24B4A', marginTop: 4, fontWeight: '500' },

  forgotRow: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 16 },
  forgotText: { fontSize: 13, color: colors.orange600, fontWeight: '600' },

  submitBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  registerText: { fontSize: 13, color: colors.n600 },
  registerLink: { fontSize: 13, fontWeight: '600', color: colors.orange600 },

  footer: { paddingVertical: 16, alignItems: 'center', backgroundColor: colors.navy },
  footerText: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  footerBrand: { color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
});
