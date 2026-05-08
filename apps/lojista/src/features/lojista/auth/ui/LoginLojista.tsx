// src/features/lojista/auth/ui/LoginLojista.tsx
import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, Modal, Pressable, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@ajulabs/theme';
import { useAuthLojistaStore } from '../model/store';

interface LoginLojistaProps {
  onLoginSuccess?: () => void;
}

type RecoveryStep = 'form' | 'success';

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function Field({
  label, value, onChange, placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, focused && styles.fieldInputFocused]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.n600}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

function RecoveryModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [step, setStep]       = useState<RecoveryStep>('form');
  const [cnpj, setCnpj]       = useState('');
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState<{ cnpj?: string; email?: string }>({});

  const handleClose = useCallback(() => {
    setStep('form');
    setCnpj('');
    setEmail('');
    setErrors({});
    onClose();
  }, [onClose]);

  const validate = useCallback(() => {
    const errs: { cnpj?: string; email?: string } = {};
    if (cnpj.replace(/\D/g, '').length !== 14) errs.cnpj = 'CNPJ inválido — deve ter 14 dígitos.';
    if (!email.includes('@') || !email.includes('.')) errs.email = 'Email inválido.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [cnpj, email]);

  const handleEnviar = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // TODO: conectar com API para enviar token de recuperação
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStep('success');
    } catch {
      setErrors({ email: 'Erro ao enviar. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  }, [validate]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.modalOverlay} onPress={handleClose}>
        <Pressable style={styles.modalSheet} onPress={e => e.stopPropagation()}>
          <View style={styles.modalHandle} />

          {step === 'form' && (
            <>
              <Text style={styles.modalTitle}>Recuperar senha</Text>
              <Text style={styles.modalSub}>
                Informe seu CNPJ e email cadastrados para receber o código de verificação.
              </Text>

              {/* CNPJ */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>CNPJ</Text>
                <TextInput
                  style={[
                    styles.fieldInput,
                    errors.cnpj ? styles.fieldInputError : undefined,
                  ]}
                  value={cnpj}
                  onChangeText={v => { setCnpj(formatCNPJ(v)); setErrors(e => ({ ...e, cnpj: undefined })); }}
                  placeholder="00.000.000/0001-00"
                  placeholderTextColor={colors.n600}
                  keyboardType="numeric"
                />
                {errors.cnpj && <Text style={styles.errorText}>{errors.cnpj}</Text>}
              </View>

              {/* Email */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>EMAIL CADASTRADO</Text>
                <TextInput
                  style={[
                    styles.fieldInput,
                    errors.email ? styles.fieldInputError : undefined,
                  ]}
                  value={email}
                  onChangeText={v => { setEmail(v); setErrors(e => ({ ...e, email: undefined })); }}
                  placeholder="loja@email.com"
                  placeholderTextColor={colors.n600}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <TouchableOpacity
                style={[styles.modalBtn, loading && { opacity: 0.7 }]}
                onPress={handleEnviar}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.modalBtnText}>Enviar código</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalCancelBtn} onPress={handleClose} activeOpacity={0.8}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'success' && (
            <>
              {/* Ícone sucesso */}
              <View style={styles.successIconWrap}>
                <Text style={styles.successIcon}>✓</Text>
              </View>
              <Text style={styles.successTitle}>Token enviado com sucesso!</Text>
              <Text style={styles.successSub}>
                Enviamos um código de verificação para{'\n'}
                <Text style={styles.successEmail}>{email}</Text>
                {'\n\n'}Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </Text>

              {/* Banner verde */}
              <View style={styles.successBanner}>
                <Text style={styles.successBannerIcon}>✓</Text>
                <Text style={styles.successBannerText}>Token enviado com sucesso!</Text>
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
  const login = useAuthLojistaStore(s => s.login);
  const [cnpj, setCnpj]             = useState('');
  const [senha, setSenha]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [error, setError]           = useState('');

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
      const msg = err instanceof Error ? err.message : 'CNPJ ou senha incorretos. Tente novamente.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [cnpj, senha, login, onLoginSuccess, router]);

  return (
    <View style={styles.container}>
      {/* Topo navy */}
      <View style={styles.top}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>A</Text>
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
          onChange={v => { setCnpj(formatCNPJ(v)); setError(''); }}
          placeholder="00.000.000/0001-00"
          keyboardType="numeric"
        />
        <Field
          label="SENHA"
          value={senha}
          onChange={v => { setSenha(v); setError(''); }}
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
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>Entrar no painel</Text>
          }
        </TouchableOpacity>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Primeira vez? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.8}>
            <Text style={styles.registerLink}>Cadastre sua loja</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>by <Text style={styles.footerBrand}>AjuLabs</Text></Text>
      </View>

      {/* Modal recuperação */}
      <RecoveryModal
        visible={showRecovery}
        onClose={() => setShowRecovery(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: colors.navy },

  // Topo
  top:                 { paddingTop: 52, paddingBottom: 28, paddingHorizontal: 24,
                         alignItems: 'center' },
  logoWrap:            { width: 52, height: 52, borderRadius: 14,
                         backgroundColor: colors.orange,
                         alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText:            { fontSize: 28, fontWeight: '800', color: '#fff' },
  topTitle:            { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  topSub:              { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 6 },

  // Card
  card:                { backgroundColor: colors.n0,
                         borderRadius: 24, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  cardContent:         { padding: 28, paddingBottom: 0 },
  cardTitle:           { fontSize: 20, fontWeight: '700', color: colors.navy },
  cardSub:             { fontSize: 13, color: colors.n600, marginTop: 4, marginBottom: 22 },

  // Campos
  field:               { marginBottom: 14 },
  fieldLabel:          { fontSize: 11, fontWeight: '700', color: colors.n600,
                         textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 },
  fieldInput:          { height: 46, borderRadius: 12, borderWidth: 1.5,
                         borderColor: colors.n200, backgroundColor: colors.n50,
                         paddingHorizontal: 14, fontSize: 14, color: colors.navy },
  fieldInputFocused:   { borderColor: colors.orange },
  fieldInputError:     { borderColor: '#E24B4A' },
  errorText:           { fontSize: 11, color: '#E24B4A', marginTop: 4, fontWeight: '500' },

  // Esqueci
  forgotRow:           { alignSelf: 'flex-end', marginTop: -4, marginBottom: 16 },
  forgotText:          { fontSize: 13, color: colors.orange600, fontWeight: '600' },

  // Submit
  submitBtn:           { height: 50, borderRadius: 14, backgroundColor: colors.orange,
                         alignItems: 'center', justifyContent: 'center' },
  submitBtnText:       { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Register
  registerRow:         { flexDirection: 'row', justifyContent: 'center',
                         alignItems: 'center', marginTop: 16 },
  registerText:        { fontSize: 13, color: colors.n600 },
  registerLink:        { fontSize: 13, fontWeight: '600', color: colors.orange600 },

  // Footer
  footer:              { paddingVertical: 16, alignItems: 'center',
                         backgroundColor: colors.navy },
  footerText:          { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  footerBrand:         { color: 'rgba(255,255,255,0.65)', fontWeight: '600' },

  // Modal
  modalOverlay:        { flex: 1, backgroundColor: 'rgba(0,9,51,0.7)',
                         justifyContent: 'flex-end' },
  modalSheet:          { backgroundColor: colors.n0,
                         borderRadius: 24, borderBottomLeftRadius: 0,
                         borderBottomRightRadius: 0, padding: 28, paddingBottom: 40 },
  modalHandle:         { width: 36, height: 4, borderRadius: 2,
                         backgroundColor: colors.n200, alignSelf: 'center', marginBottom: 20 },
  modalTitle:          { fontSize: 20, fontWeight: '700', color: colors.navy, marginBottom: 6 },
  modalSub:            { fontSize: 13, color: colors.n600, marginBottom: 20, lineHeight: 19 },

  // Opções de método
  methodBtn:           { flexDirection: 'row', alignItems: 'center', gap: 12,
                         padding: 14, borderRadius: 14, borderWidth: 1.5,
                         borderColor: colors.n200, marginBottom: 10 },
  methodBtnSelected:   { borderColor: colors.orange, backgroundColor: colors.orange100 },
  methodIcon:          { width: 40, height: 40, borderRadius: 10,
                         backgroundColor: colors.n100,
                         alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  methodInfo:          { flex: 1 },
  methodTitle:         { fontSize: 14, fontWeight: '600', color: colors.navy },
  methodSubText:       { fontSize: 11, color: colors.n600, marginTop: 2 },
  methodRadio:         { width: 20, height: 20, borderRadius: 10,
                         borderWidth: 2, borderColor: colors.n200,
                         alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  methodRadioSelected: { borderColor: colors.orange, backgroundColor: colors.orange },
  methodRadioDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },

  // Botões do modal
  modalBtn:            { height: 50, borderRadius: 14, backgroundColor: colors.orange,
                         alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  modalBtnText:        { fontSize: 15, fontWeight: '700', color: '#fff' },
  modalCancelBtn:      { height: 44, borderRadius: 12, borderWidth: 1.5,
                         borderColor: colors.n200,
                         alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  modalCancelText:     { fontSize: 14, fontWeight: '600', color: colors.n600 },

  // Sucesso
  successIconWrap:     { width: 72, height: 72, borderRadius: 36,
                         backgroundColor: 'rgba(57,255,137,0.15)',
                         alignItems: 'center', justifyContent: 'center',
                         alignSelf: 'center', marginBottom: 16 },
  successIcon:         { fontSize: 32, color: '#046C2E' },
  successTitle:        { fontSize: 20, fontWeight: '700', color: colors.navy,
                         textAlign: 'center', marginBottom: 10 },
  successSub:          { fontSize: 13, color: colors.n600, textAlign: 'center',
                         lineHeight: 20, marginBottom: 16 },
  successEmail:        { fontWeight: '700', color: colors.navy },
  successBanner:       { flexDirection: 'row', alignItems: 'center', gap: 8,
                         backgroundColor: 'rgba(57,255,137,0.15)',
                         borderWidth: 1, borderColor: 'rgba(4,108,46,0.3)',
                         borderRadius: 12, padding: 12, marginBottom: 16 },
  successBannerIcon:   { fontSize: 16, color: '#046C2E', fontWeight: '700' },
  successBannerText:   { fontSize: 13, fontWeight: '600', color: '#046C2E' },
});