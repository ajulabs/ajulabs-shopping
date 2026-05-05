import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@ajulabs/theme';
import { useAuthStore } from '../../../../store';

export function LoginScreen() {
  const router = useRouter();
  const enviarCodigo = useAuthStore(s => s.enviarCodigo);
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);

  function formatarTelefone(raw: string): string {
    const nums = raw.replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 2) return `(${nums}`;
    if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
  }

  const telefoneRaw = telefone.replace(/\D/g, '');
  const valido = telefoneRaw.length === 11;

  async function handleEnviar() {
    if (!valido) return;
    setLoading(true);
    await enviarCodigo(telefoneRaw);
    setLoading(false);
    router.push('/(auth)/verify');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>🛒</Text>
          <Text style={styles.logoText}>AjuLabs</Text>
          <Text style={styles.logoSub}>Shopping Digital</Text>
        </View>

        {/* Título */}
        <Text style={styles.titulo}>Entrar com telefone</Text>
        <Text style={styles.descricao}>
          Vamos te enviar um código SMS para confirmar seu número
        </Text>

        {/* Input telefone */}
        <View style={styles.inputBox}>
          <Text style={styles.prefix}>+55</Text>
          <TextInput
            style={styles.input}
            placeholder="(79) 99999-1234"
            placeholderTextColor={colors.n300}
            keyboardType="phone-pad"
            value={telefone}
            onChangeText={(t) => setTelefone(formatarTelefone(t))}
            maxLength={16}
          />
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.btn, !valido && styles.btnDisabled]}
          onPress={handleEnviar}
          activeOpacity={0.9}
          disabled={!valido || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnTxt}>Enviar código SMS</Text>
          )}
        </TouchableOpacity>

        {/* Termos */}
        <Text style={styles.termos}>
          Ao continuar, você aceita nossos{' '}
          <Text style={styles.link}>Termos de Uso</Text> e{' '}
          <Text style={styles.link}>Política de Privacidade</Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#FAFBFE' },
  content:    { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },

  logoBox:    { alignItems: 'center', marginBottom: 32 },
  logoEmoji:  { fontSize: 48 },
  logoText:   { fontSize: 28, fontWeight: '800', color: colors.navy, marginTop: 8, letterSpacing: -0.5 },
  logoSub:    { fontSize: 13, color: colors.n600, marginTop: 2 },

  titulo:     { fontSize: 20, fontWeight: '700', color: colors.navy, marginBottom: 6 },
  descricao:  { fontSize: 13, color: colors.n600, lineHeight: 18, marginBottom: 20 },

  inputBox:   { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.n0,
                borderRadius: 14, borderWidth: 1.5, borderColor: colors.n200,
                paddingHorizontal: 14, height: 52 },
  prefix:     { fontSize: 15, fontWeight: '600', color: colors.navy, marginRight: 8 },
  input:      { flex: 1, fontSize: 16, color: colors.navy, fontWeight: '500' },

  btn:        { backgroundColor: colors.orange, height: 52, borderRadius: 14,
                alignItems: 'center', justifyContent: 'center', marginTop: 16,
                shadowColor: colors.orange, shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3, shadowRadius: 14, elevation: 4 },
  btnDisabled:{ opacity: 0.5 },
  btnTxt:     { color: '#fff', fontSize: 15, fontWeight: '700' },

  termos:     { fontSize: 11, color: colors.n500, textAlign: 'center', marginTop: 16, lineHeight: 16 },
  link:       { color: colors.orange, fontWeight: '600' },
});