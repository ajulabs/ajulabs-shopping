import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, AjuLogo } from '@ajulabs/theme';
import { useLoginColaborador } from '../model/useLoginColaborador';

interface Props {
  onLoginSuccess?: () => void;
  onVoltar?: () => void;
}

export function LoginColaboradorScreen({ onLoginSuccess, onVoltar }: Props) {
  const insets = useSafeAreaInsets();
  const {
    router,
    email,
    setEmail,
    senha,
    setSenha,
    senhaVisivel,
    setSenhaVisivel,
    loading,
    error,
    setError,
    handleLogin,
  } = useLoginColaborador(onLoginSuccess);

  return (
    <View style={styles.container}>
      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <View style={{ marginBottom: 16 }}>
          <AjuLogo size={52} />
        </View>
        <Text style={styles.topTitle}>Acesso da Equipe</Text>
        <Text style={styles.topSub}>Faça login com suas credenciais de colaborador.</Text>
      </View>

      <ScrollView
        style={styles.card}
        contentContainerStyle={styles.cardContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.cardTitle}>Entrar</Text>
        <Text style={styles.cardSub}>Use seu email e senha de colaborador</Text>

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>EMAIL</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.inputInner}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setError('');
              }}
              placeholder="colaborador@loja.com"
              placeholderTextColor={colors.n600}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Senha */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>SENHA</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.inputInner}
              value={senha}
              onChangeText={(v) => {
                setSenha(v);
                setError('');
              }}
              placeholder="••••••••"
              placeholderTextColor={colors.n600}
              secureTextEntry={!senhaVisivel}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setSenhaVisivel((s) => !s)}
              hitSlop={10}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={senhaVisivel ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.n600}
              />
            </TouchableOpacity>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

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

        <TouchableOpacity
          style={styles.voltarBtn}
          onPress={onVoltar ?? (() => router.back())}
          activeOpacity={0.8}
        >
          <Text style={styles.voltarText}>Voltar ao login do lojista</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          by <Text style={styles.footerBrand}>AjuLabs</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navy },

  top: { paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
  topTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  topSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 6, textAlign: 'center' },

  card: {
    backgroundColor: colors.n0,
    borderRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  cardContent: { padding: 28, paddingBottom: 0 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: colors.navy },
  cardSub: { fontSize: 13, color: colors.n600, marginTop: 4, marginBottom: 22 },

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
  inputInner: { flex: 1, fontSize: 14, color: colors.navy },
  eyeBtn: { paddingLeft: 8 },
  errorText: { fontSize: 11, color: '#E24B4A', marginTop: 4, marginBottom: 8, fontWeight: '500' },

  submitBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  voltarBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.n200,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  voltarText: { fontSize: 14, fontWeight: '600', color: colors.n600 },

  footer: { paddingVertical: 16, alignItems: 'center', backgroundColor: colors.navy },
  footerText: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  footerBrand: { color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
});
