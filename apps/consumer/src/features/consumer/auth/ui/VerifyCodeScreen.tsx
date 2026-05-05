import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@ajulabs/theme';
import { useAuthStore } from '../../../../store';

export function VerifyCodeScreen() {
  const router = useRouter();
  const telefone = useAuthStore(s => s.telefone);
  const verificarCodigo = useAuthStore(s => s.verificarCodigo);
  const [digits, setDigits] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const refs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  function handleDigit(index: number, value: string) {
    const num = value.replace(/\D/g, '');
    if (!num && index > 0) {
      // Backspace: voltar pro anterior
      const novo = [...digits];
      novo[index] = '';
      setDigits(novo);
      refs[index - 1].current?.focus();
      return;
    }
    const novo = [...digits];
    novo[index] = num.slice(0, 1);
    setDigits(novo);
    if (num && index < 3) {
      refs[index + 1].current?.focus();
    }
  }

  const codigo = digits.join('');
  const completo = codigo.length === 4;

  async function handleVerificar() {
    if (!completo) return;
    setLoading(true);
    const ok = await verificarCodigo(codigo);
    setLoading(false);
    if (ok) {
      router.replace('/(consumer)/vitrines');
    } else {
      Alert.alert('Código inválido', 'Confira o SMS e tente novamente.');
      setDigits(['', '', '', '']);
      refs[0].current?.focus();
    }
  }

  function formatarTelefone(raw: string | null): string {
    if (!raw) return '';
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.btnBack} activeOpacity={0.85}>
          <Text style={{ fontSize: 20, color: colors.navy, fontWeight: '600' }}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>Confirme o código</Text>
        <Text style={styles.descricao}>
          Enviamos um SMS para{' '}
          <Text style={{ fontWeight: '700', color: colors.navy }}>
            +55 {formatarTelefone(telefone)}
          </Text>
        </Text>

        {/* 4 digit inputs */}
        <View style={styles.digitsRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={refs[i]}
              style={[styles.digitInput, d ? styles.digitFilled : null]}
              keyboardType="number-pad"
              maxLength={1}
              value={d}
              onChangeText={(v) => handleDigit(i, v)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && !digits[i] && i > 0) {
                  const novo = [...digits];
                  novo[i - 1] = '';
                  setDigits(novo);
                  refs[i - 1].current?.focus();
                }
              }}
            />
          ))}
        </View>

        <Text style={styles.hint}>
          O código mock aceita qualquer 4 dígitos
        </Text>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.btn, !completo && styles.btnDisabled]}
          onPress={handleVerificar}
          activeOpacity={0.9}
          disabled={!completo || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnTxt}>Verificar</Text>
          )}
        </TouchableOpacity>

        {/* Reenviar */}
        <TouchableOpacity style={{ marginTop: 16 }} activeOpacity={0.7}>
          <Text style={styles.reenviar}>Não recebeu? <Text style={styles.link}>Reenviar código</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#FAFBFE' },
  content:      { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },

  btnBack:      { position: 'absolute', top: 52, left: 0, width: 38, height: 38, borderRadius: 19,
                  backgroundColor: colors.n50, alignItems: 'center', justifyContent: 'center' },

  titulo:       { fontSize: 22, fontWeight: '700', color: colors.navy, marginBottom: 6 },
  descricao:    { fontSize: 13, color: colors.n600, lineHeight: 18, marginBottom: 28 },

  digitsRow:    { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  digitInput:   { width: 56, height: 64, borderRadius: 14, borderWidth: 1.5, borderColor: colors.n200,
                  backgroundColor: colors.n0, textAlign: 'center', fontSize: 24, fontWeight: '700',
                  color: colors.navy },
  digitFilled:  { borderColor: colors.orange, backgroundColor: 'rgba(242,118,15,0.04)' },

  hint:         { fontSize: 11, color: colors.n500, textAlign: 'center', marginTop: 12 },

  btn:          { backgroundColor: colors.orange, height: 52, borderRadius: 14,
                  alignItems: 'center', justifyContent: 'center', marginTop: 24,
                  shadowColor: colors.orange, shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3, shadowRadius: 14, elevation: 4 },
  btnDisabled:  { opacity: 0.5 },
  btnTxt:       { color: '#fff', fontSize: 15, fontWeight: '700' },

  reenviar:     { fontSize: 13, color: colors.n600, textAlign: 'center' },
  link:         { color: colors.orange, fontWeight: '600' },
});