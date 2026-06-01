import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, AjuLogo } from '@ajulabs/theme';
import { useAuthStore } from '../../../../store';
import { formatCPF } from '../lib/formatCPF';
import { Field } from './components/Field';
import { RecoveryModal } from './components/RecoveryModal';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [error, setError] = useState('');

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
          : typeof err === 'string'
            ? err
            : 'CPF ou senha incorretos. Tente novamente.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [cpf, senha, login, onLoginSuccess]);

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <View style={{ marginBottom: 16 }}>
          <AjuLogo size={52} />
        </View>
        <Text style={styles.topTitle}>AjuLabs Shopping</Text>
        <Text style={styles.topSub}>Seu shopping digital em Aracaju.</Text>
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
          <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.8}>
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

  top: { paddingTop: 52, paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
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
