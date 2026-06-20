import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, AjuLogo } from '../../../../theme';
import { useLogin } from '../model/useLogin';
import { LoginField } from './components/LoginField';
import { PasswordRecoveryModal } from './components/PasswordRecoveryModal';

interface LoginLojistaProps {
  onLoginSuccess?: () => void;
}

export function LoginLojista({ onLoginSuccess }: LoginLojistaProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cnpj, senha, loading, error, onChangeCnpj, onChangeSenha, handleLogin } =
    useLogin(onLoginSuccess);
  const [showRecovery, setShowRecovery] = useState(false);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Topo navy */}
        <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
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

          <LoginField
            label="CNPJ"
            value={cnpj}
            onChange={onChangeCnpj}
            placeholder="00.000.000/0001-00"
            keyboardType="numeric"
          />
          <LoginField
            label="SENHA"
            value={senha}
            onChange={onChangeSenha}
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
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          by <Text style={styles.footerBrand}>AjuLabs</Text>
        </Text>
      </View>

      {/* Modal recuperação */}
      <PasswordRecoveryModal visible={showRecovery} onClose={() => setShowRecovery(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navy },

  // Topo
  top: { paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
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
});
