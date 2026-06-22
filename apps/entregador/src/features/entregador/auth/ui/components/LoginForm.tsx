import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@ajulabs/theme';
import { formatCPF } from '../../../../../shared/lib/formatCPF';
import { Field } from './Field';

interface LoginFormProps {
  cpf: string;
  setCpf: (v: string) => void;
  senha: string;
  setSenha: (v: string) => void;
  loading: boolean;
  error: string;
  setError: (v: string) => void;
  handleLogin: () => void;
  onForgotPassword: () => void;
  router: ReturnType<typeof useRouter>;
}

export function LoginForm({
  cpf,
  setCpf,
  senha,
  setSenha,
  loading,
  error,
  setError,
  handleLogin,
  onForgotPassword,
  router,
}: LoginFormProps) {
  return (
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

      <TouchableOpacity style={styles.forgotRow} onPress={onForgotPassword} activeOpacity={0.7}>
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
  );
}

const styles = StyleSheet.create({
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
});
