import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, AjuLogo } from '../../../../theme';
import { useAuthLojistaStore } from '../model/store';
import { validateCNPJ } from '../lib/validateCNPJ';
import { PhoneInput } from './components/PhoneInput';

interface CadastroLojistaProps {
  onCadastroSuccess?: () => void;
}

interface FormData {
  cnpj: string;
  nomeLoja: string;
  telefone: string;
  telefoneCompleto: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function Field({
  label, value, onChange, placeholder, secureTextEntry = false,
  keyboardType = 'default', error, onBlur,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  error?: string; onBlur?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputRow, focused && styles.inputRowFocused, !!error && styles.inputRowError]}>
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
          onBlur={() => { setFocused(false); onBlur?.(); }}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShown(s => !s)} hitSlop={10} style={styles.eyeBtn}>
            <Ionicons name={shown ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.n600} />
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

export function CadastroLojista({ onCadastroSuccess }: CadastroLojistaProps) {
  const router = useRouter();
  const registrar = useAuthLojistaStore(s => s.registrar);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormData>({
    cnpj: '', nomeLoja: '', telefone: '', telefoneCompleto: '',
    email: '', senha: '', confirmarSenha: '',
  });

  const setField = useCallback((key: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(e => ({ ...e, [key]: '' }));
  }, []);

  const blurCnpj = () => {
    if (form.cnpj && !validateCNPJ(form.cnpj))
      setErrors(e => ({ ...e, cnpj: 'CNPJ inválido.' }));
  };

  const blurEmail = () => {
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email))
      setErrors(e => ({ ...e, email: 'Email inválido.' }));
  };

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!validateCNPJ(form.cnpj))                                   errs.cnpj = 'CNPJ inválido.';
    if (!form.nomeLoja.trim())                                       errs.nomeLoja = 'Informe o nome da loja.';
    if (form.telefoneCompleto.replace(/\D/g, '').length < 10)       errs.telefone = 'Telefone inválido.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email))         errs.email = 'Email inválido.';
    if (form.senha.length < 8)                                       errs.senha = 'Mínimo 8 caracteres.';
    else if (!/[A-Z]/.test(form.senha))                              errs.senha = 'Inclua ao menos 1 letra maiúscula.';
    else if (!/[0-9]/.test(form.senha))                              errs.senha = 'Inclua ao menos 1 número.';
    if (form.senha !== form.confirmarSenha)                          errs.confirmarSenha = 'As senhas não coincidem.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form]);

  const handleCadastro = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    console.log('[Lojista][Cadastro] cnpj:', form.cnpj, '| email:', form.email);
    try {
      await registrar({
        cnpj:             form.cnpj,
        nomeResponsavel:  form.nomeLoja,
        telefone:         form.telefoneCompleto,
        email:            form.email,
        senha:            form.senha,
      });
      onCadastroSuccess?.();
      router.replace('/(lojista)/pedidos');
    } catch (e) {
      const isNetwork = e instanceof Error && (e.message.includes('Network') || e.message.includes('fetch') || e.message.includes('Failed'));
      setErrors({ geral: isNetwork ? 'Sem conexão com o servidor.' : e instanceof Error ? e.message : 'Erro ao criar conta.' });
    } finally {
      setLoading(false);
    }
  }, [form, validate, registrar, onCadastroSuccess, router]);

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <View style={{ marginBottom: 16 }}>
          <AjuLogo size={52} />
        </View>
        <Text style={styles.topTitle}>Portal do Lojista</Text>
        <Text style={styles.topSub}>Venda no Shopping Digital em minutos.</Text>
      </View>

      <ScrollView style={styles.card} contentContainerStyle={styles.cardContent}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.cardTitle}>Criar conta</Text>
        <Text style={styles.cardSub}>Preencha os dados da sua loja para começar</Text>

        <Field
          label="CNPJ"
          value={form.cnpj}
          onChange={v => setField('cnpj', formatCNPJ(v))}
          placeholder="00.000.000/0001-00"
          keyboardType="numeric"
          error={errors.cnpj}
          onBlur={blurCnpj}
        />
        <Field
          label="NOME DA LOJA"
          value={form.nomeLoja}
          onChange={v => setField('nomeLoja', v)}
          placeholder="Ex: Loja do Chico — Calçados"
          error={errors.nomeLoja}
        />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>TELEFONE / WHATSAPP</Text>
          <PhoneInput
            value={form.telefone}
            onChange={(local, full) => {
              setForm(f => ({ ...f, telefone: local, telefoneCompleto: full }));
              setErrors(e => ({ ...e, telefone: '' }));
            }}
            error={errors.telefone}
          />
        </View>

        <Field
          label="EMAIL"
          value={form.email}
          onChange={v => setField('email', v)}
          placeholder="loja@email.com"
          keyboardType="email-address"
          error={errors.email}
          onBlur={blurEmail}
        />
        <Field
          label="SENHA"
          value={form.senha}
          onChange={v => setField('senha', v)}
          placeholder="Mín. 8 chars, 1 maiúscula, 1 número"
          secureTextEntry
          error={errors.senha}
        />
        <Field
          label="CONFIRMAR SENHA"
          value={form.confirmarSenha}
          onChange={v => setField('confirmarSenha', v)}
          placeholder="Repita a senha"
          secureTextEntry
          error={errors.confirmarSenha}
        />

        <Text style={styles.terms}>
          Ao criar sua conta você concorda com os{' '}
          <Text style={styles.termsLink}>Termos de Uso</Text> e a{' '}
          <Text style={styles.termsLink}>Política de Privacidade</Text> da AjuLabs.
        </Text>

        {errors.geral ? <Text style={styles.errorGeral}>{errors.geral}</Text> : null}

        <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleCadastro} activeOpacity={0.85} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>Criar minha conta</Text>}
        </TouchableOpacity>

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
  container:       { flex: 1, backgroundColor: colors.navy },
  top:             { paddingTop: 52, paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
  topTitle:        { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  topSub:          { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 6 },
  card:            { backgroundColor: colors.n0, borderRadius: 24,
                     borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  cardContent:     { padding: 28, paddingBottom: 0 },
  cardTitle:       { fontSize: 20, fontWeight: '700', color: colors.navy },
  cardSub:         { fontSize: 13, color: colors.n600, marginTop: 4, marginBottom: 20 },
  field:           { marginBottom: 12 },
  fieldLabel:      { fontSize: 11, fontWeight: '700', color: colors.n600,
                     textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 },
  inputRow:        { height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: colors.n200,
                     backgroundColor: colors.n50, flexDirection: 'row', alignItems: 'center',
                     paddingHorizontal: 14 },
  inputRowFocused: { borderColor: colors.orange },
  inputRowError:   { borderColor: '#E24B4A' },
  inputInner:      { flex: 1, fontSize: 14, color: colors.navy },
  eyeBtn:          { paddingLeft: 8 },
  fieldError:      { fontSize: 11, color: '#E24B4A', marginTop: 4, fontWeight: '500' },
  terms:           { fontSize: 12, color: colors.n600, textAlign: 'center',
                     marginVertical: 14, lineHeight: 18 },
  termsLink:       { color: colors.orange600, fontWeight: '600' },
  errorGeral:      { fontSize: 13, color: '#E24B4A', textAlign: 'center',
                     marginBottom: 10, fontWeight: '500' },
  submitBtn:       { height: 50, borderRadius: 14, backgroundColor: colors.orange,
                     alignItems: 'center', justifyContent: 'center' },
  submitBtnText:   { fontSize: 15, fontWeight: '700', color: '#fff' },
  loginRow:        { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  loginText:       { fontSize: 13, color: colors.n600 },
  loginLink:       { fontSize: 13, fontWeight: '600', color: colors.orange600 },
});
