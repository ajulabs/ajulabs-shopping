import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@ajulabs/theme';
import { useAuthStore } from '../../../../store';
import { formatCPF } from '../lib/formatCPF';
import { Field } from './components/Field';

interface CadastroConsumerProps {
  onCadastroSuccess?: () => void;
}

function formatTelefone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function CadastroConsumer({ onCadastroSuccess }: CadastroConsumerProps) {
  const router = useRouter();
  const registrar = useAuthStore(s => s.registrar);
  const [nome, setNome]           = useState('');
  const [cpf, setCpf]             = useState('');
  const [telefone, setTelefone]   = useState('');
  const [email, setEmail]         = useState('');
  const [senha, setSenha]         = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading]     = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});

  const clearError = (key: string) =>
    setErrors(e => ({ ...e, [key]: '' }));

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    if (nome.trim().length < 2)
      errs.nome = 'Informe seu nome completo.';
    if (cpf.replace(/\D/g, '').length !== 11)
      errs.cpf = 'CPF inválido — deve ter 11 dígitos.';
    if (telefone.replace(/\D/g, '').length < 10)
      errs.telefone = 'Telefone inválido.';
    if (!email.includes('@') || !email.includes('.'))
      errs.email = 'Email inválido.';
    if (senha.length < 8)
      errs.senha = 'A senha deve ter pelo menos 8 caracteres.';
    else if (!/[A-Z]/.test(senha))
      errs.senha = 'A senha deve conter pelo menos 1 letra maiúscula.';
    else if (!/[0-9]/.test(senha))
      errs.senha = 'A senha deve conter pelo menos 1 número.';
    if (senha !== confirmar)
      errs.confirmar = 'As senhas não coincidem.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [nome, cpf, telefone, email, senha, confirmar]);

  const handleCadastro = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await registrar({ nome, cpf, telefone, email, senha });
      onCadastroSuccess?.();
      router.replace('/(consumer)/chat');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar conta. Tente novamente.';
      setErrors({ geral: msg });
    } finally {
      setLoading(false);
    }
  }, [validate, registrar, nome, cpf, telefone, email, senha, onCadastroSuccess, router]);

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>A</Text>
        </View>
        <Text style={styles.topTitle}>Criar conta</Text>
        <Text style={styles.topSub}>Compre nos melhores lojistas de Aracaju.</Text>
      </View>

      <ScrollView
        style={styles.card}
        contentContainerStyle={styles.cardContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.cardTitle}>Seus dados</Text>
        <Text style={styles.cardSub}>Preencha para criar sua conta</Text>

        <Field
          label="NOME COMPLETO"
          value={nome}
          onChange={v => { setNome(v.replace(/[^a-zA-ZÀ-ÿ\s]/g, '')); clearError('nome'); }}
          placeholder="João da Silva"
          autoCapitalize="words"
          error={errors.nome}
        />
        <Field
          label="CPF"
          value={cpf}
          onChange={v => { setCpf(formatCPF(v)); clearError('cpf'); }}
          placeholder="000.000.000-00"
          keyboardType="numeric"
          error={errors.cpf}
        />
        <Field
          label="TELEFONE"
          value={telefone}
          onChange={v => { setTelefone(formatTelefone(v)); clearError('telefone'); }}
          placeholder="(79) 99999-1234"
          keyboardType="phone-pad"
          error={errors.telefone}
        />
        <Field
          label="EMAIL"
          value={email}
          onChange={v => { setEmail(v); clearError('email'); }}
          placeholder="voce@email.com"
          keyboardType="email-address"
          error={errors.email}
        />
        <Field
          label="SENHA"
          value={senha}
          onChange={v => { setSenha(v); clearError('senha'); }}
          placeholder="Mín. 8 chars, 1 maiúscula, 1 número"
          secureTextEntry
          error={errors.senha}
        />
        <Field
          label="CONFIRMAR SENHA"
          value={confirmar}
          onChange={v => { setConfirmar(v); clearError('confirmar'); }}
          placeholder="Repita a senha"
          secureTextEntry
          error={errors.confirmar}
        />

        {errors.geral ? <Text style={styles.errorGeral}>{errors.geral}</Text> : null}

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleCadastro}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>Criar conta</Text>
          }
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Já tem conta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.8}>
            <Text style={styles.loginLink}>Entrar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.termos}>
          Ao criar sua conta, você concorda com nossos{' '}
          <Text style={styles.termosLink}>Termos de Uso</Text> e{' '}
          <Text style={styles.termosLink}>Política de Privacidade</Text>.
        </Text>

        <View style={{ height: 32 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>by <Text style={styles.footerBrand}>AjuLabs</Text></Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.navy },

  top:           { paddingTop: 52, paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
  backBtn:       { position: 'absolute', top: 52, left: 24, width: 38, height: 38,
                   borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)',
                   alignItems: 'center', justifyContent: 'center' },
  logoWrap:      { width: 52, height: 52, borderRadius: 14, backgroundColor: colors.orange,
                   alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText:      { fontSize: 28, fontWeight: '800', color: '#fff' },
  topTitle:      { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  topSub:        { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 6 },

  card:          { backgroundColor: colors.n0, borderRadius: 24,
                   borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  cardContent:   { padding: 28, paddingBottom: 0 },
  cardTitle:     { fontSize: 20, fontWeight: '700', color: colors.navy },
  cardSub:       { fontSize: 13, color: colors.n600, marginTop: 4, marginBottom: 22 },

  errorGeral:    { fontSize: 13, color: '#E24B4A', textAlign: 'center',
                   marginBottom: 12, fontWeight: '500' },

  submitBtn:     { height: 50, borderRadius: 14, backgroundColor: colors.orange,
                   alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  loginRow:      { flexDirection: 'row', justifyContent: 'center',
                   alignItems: 'center', marginTop: 16 },
  loginText:     { fontSize: 13, color: colors.n600 },
  loginLink:     { fontSize: 13, fontWeight: '600', color: colors.orange600 },

  termos:        { fontSize: 11, color: colors.n500, textAlign: 'center',
                   marginTop: 14, lineHeight: 16 },
  termosLink:    { color: colors.orange, fontWeight: '600' },

  footer:        { paddingVertical: 16, alignItems: 'center', backgroundColor: colors.navy },
  footerText:    { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  footerBrand:   { color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
});
