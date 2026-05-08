// src/features/lojista/auth/ui/CadastroLojista.tsx
import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../../../theme';
import { useAuthLojistaStore } from '../model/store';

interface CadastroLojistaProps {
  onCadastroSuccess?: () => void;
}

interface FormData {
  cnpj: string;
  nomeLoja: string;
  telefone: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

// ─── Formatação de CNPJ ───────────────────────────────────────
function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

// ─── Formatação de telefone ───────────────────────────────────
function formatTelefone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{1})(\d{4})(\d)/, '$1 $2-$3');
}

// ─── Campo de formulário ──────────────────────────────────────
function Field({
  label, value, onChange, placeholder,
  secureTextEntry = false, keyboardType = 'default',
}: {
  label: string; value: string;
  onChange: (v: string) => void;
  placeholder?: string; secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
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
          <TouchableOpacity onPress={() => setShown(s => !s)} hitSlop={10} style={styles.eyeBtn}>
            <Ionicons name={shown ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.n600} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────
export function CadastroLojista({ onCadastroSuccess }: CadastroLojistaProps) {
  const router = useRouter();
  const registrar = useAuthLojistaStore(s => s.registrar);
  const [loading, setLoading] = useState(false);
  const [errorGeral, setErrorGeral] = useState('');
  const [form, setForm] = useState<FormData>({
    cnpj: '',
    nomeLoja: '',
    telefone: '',
    email: '',
    senha: '',
    confirmarSenha: '',
  });

  const updateForm = useCallback((key: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const validateForm = useCallback((): string | null => {
    const cnpjDigits = form.cnpj.replace(/\D/g, '');
    if (cnpjDigits.length !== 14) return 'CNPJ inválido — deve ter 14 dígitos.';
    if (!form.nomeLoja.trim()) return 'Informe o nome da loja.';
    const telDigits = form.telefone.replace(/\D/g, '');
    if (telDigits.length < 10) return 'Telefone inválido.';
    if (!form.email.includes('@')) return 'Email inválido.';
    if (form.senha.length < 8) return 'A senha deve ter no mínimo 8 caracteres.';
    if (form.senha !== form.confirmarSenha) return 'As senhas não coincidem.';
    return null;
  }, [form]);

  const handleCadastro = useCallback(async () => {
    const erro = validateForm();
    if (erro) {
      setErrorGeral(erro);
      return;
    }
    setErrorGeral('');
    setLoading(true);
    try {
      await registrar({
        cnpj: form.cnpj,
        nomeResponsavel: form.nomeLoja,
        telefone: form.telefone,
        email: form.email,
        senha: form.senha,
      });
      onCadastroSuccess?.();
      router.replace('/(lojista)/pedidos');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Não foi possível criar sua conta. Tente novamente.';
      setErrorGeral(msg);
    } finally {
      setLoading(false);
    }
  }, [form, validateForm, registrar, onCadastroSuccess, router]);

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
        <Text style={styles.cardTitle}>Criar conta</Text>
        <Text style={styles.cardSub}>Preencha os dados da sua loja para começar</Text>

        {/* Campos */}
        <Field
          label="CNPJ"
          value={form.cnpj}
          onChange={v => updateForm('cnpj', formatCNPJ(v))}
          placeholder="00.000.000/0001-00"
          keyboardType="numeric"
        />
        <Field
          label="NOME DA LOJA"
          value={form.nomeLoja}
          onChange={v => updateForm('nomeLoja', v)}
          placeholder="Ex: Loja do Chico — Calçados"
        />
        <Field
          label="TELEFONE / WHATSAPP"
          value={form.telefone}
          onChange={v => updateForm('telefone', formatTelefone(v))}
          placeholder="(79) 9 0000-0000"
          keyboardType="phone-pad"
        />
        <Field
          label="EMAIL"
          value={form.email}
          onChange={v => updateForm('email', v)}
          placeholder="loja@email.com"
          keyboardType="email-address"
        />
        <Field
          label="SENHA"
          value={form.senha}
          onChange={v => updateForm('senha', v)}
          placeholder="Mínimo 8 caracteres"
          secureTextEntry
        />
        <Field
          label="CONFIRMAR SENHA"
          value={form.confirmarSenha}
          onChange={v => updateForm('confirmarSenha', v)}
          placeholder="Repita a senha"
          secureTextEntry
        />

        {/* Termos */}
        <Text style={styles.terms}>
          Ao criar sua conta você concorda com os{' '}
          <Text style={styles.termsLink}>Termos de Uso</Text>
          {' '}e a{' '}
          <Text style={styles.termsLink}>Política de Privacidade</Text>
          {' '}da AjuLabs.
        </Text>

        {errorGeral ? <Text style={styles.errorGeral}>{errorGeral}</Text> : null}

        {/* Botão cadastrar */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleCadastro}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>Criar minha conta</Text>
          }
        </TouchableOpacity>

        {/* Link login */}
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Já tem conta? </Text>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.loginLink}>Entrar no painel</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.navy },

  // Topo
  top:                { paddingTop: 52, paddingBottom: 28, paddingHorizontal: 24,
                        alignItems: 'center' },
  logoWrap:           { width: 52, height: 52, borderRadius: 14,
                        backgroundColor: colors.orange,
                        alignItems: 'center', justifyContent: 'center',
                        marginBottom: 16 },
  logoText:           { fontSize: 28, fontWeight: '800', color: '#fff' },
  topTitle:           { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  topSub:             { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 6 },

  // Card
  card:               { backgroundColor: colors.n0, borderRadius: 24,
                        borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  cardContent:        { padding: 28, paddingBottom: 0 },
  cardTitle:          { fontSize: 20, fontWeight: '700', color: colors.navy },
  cardSub:            { fontSize: 13, color: colors.n600, marginTop: 4, marginBottom: 20 },

  // Campos
  field:              { marginBottom: 12 },
  fieldLabel:         { fontSize: 11, fontWeight: '700', color: colors.n600,
                        textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 },
  inputRow:           { height: 46, borderRadius: 12, borderWidth: 1.5,
                        borderColor: colors.n200, backgroundColor: colors.n50,
                        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  inputRowFocused:    { borderColor: colors.orange },
  inputInner:         { flex: 1, fontSize: 14, color: colors.navy },
  eyeBtn:             { paddingLeft: 8 },
  fieldInput:         { height: 46, borderRadius: 12, borderWidth: 1.5,
                        borderColor: colors.n200, backgroundColor: colors.n50,
                        paddingHorizontal: 14, fontSize: 14, color: colors.navy },
  fieldInputFocused:  { borderColor: colors.orange },

  // Termos
  terms:              { fontSize: 12, color: colors.n600, textAlign: 'center',
                        marginVertical: 14, lineHeight: 18 },
  termsLink:          { color: colors.orange600, fontWeight: '600' },

  errorGeral:         { fontSize: 13, color: '#E24B4A', textAlign: 'center',
                        marginBottom: 10, fontWeight: '500' },

  // Submit
  submitBtn:          { height: 50, borderRadius: 14, backgroundColor: colors.orange,
                        alignItems: 'center', justifyContent: 'center' },
  submitBtnText:      { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Login link
  loginRow:           { flexDirection: 'row', justifyContent: 'center',
                        alignItems: 'center', marginTop: 16 },
  loginText:          { fontSize: 13, color: colors.n600 },
  loginLink:          { fontSize: 13, fontWeight: '600', color: colors.orange600 },
});