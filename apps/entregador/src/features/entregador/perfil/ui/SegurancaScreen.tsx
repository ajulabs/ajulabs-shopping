import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EntregadorService } from '../../../../lib/authServices';
import { useAuthEntregadorStore } from '../../auth/model/store';

interface Props {
  onBack: () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function SecureInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={[s.input, focused && s.inputFocused]}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9099B3"
        secureTextEntry={!show}
        autoCapitalize="none"
        style={s.inputInner}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <TouchableOpacity onPress={() => setShow((v) => !v)} hitSlop={10} style={{ paddingLeft: 8 }}>
        <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9099B3" />
      </TouchableOpacity>
    </View>
  );
}

function PlainInput({
  value,
  onChange,
  placeholder,
  keyboard = 'default',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboard?: any;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[s.input, focused && s.inputFocused]}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9099B3"
        keyboardType={keyboard}
        style={s.inputInner}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

export function SegurancaScreen({ onBack }: Props) {
  const token = useAuthEntregadorStore((s) => s.token);
  const nomeAuth = useAuthEntregadorStore((s) => s.nome);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loadingPerfil, setLoadingPerfil] = useState(true);
  const [savingPerfil, setSavingPerfil] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [savingSenha, setSavingSenha] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadingPerfil(false);
      return;
    }
    EntregadorService.buscarPerfil(token)
      .then((p) => {
        setNome(p?.entregador?.nome ?? nomeAuth ?? '');
        setEmail(p?.entregador?.email ?? '');
        setTelefone(p?.entregador?.telefone ?? '');
      })
      .catch(() => {
        setNome(nomeAuth ?? '');
      })
      .finally(() => setLoadingPerfil(false));
  }, [token]);

  const salvarDados = async () => {
    if (!token) return;
    if (nome.trim().length < 2) {
      Alert.alert('Erro', 'Nome muito curto.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Erro', 'Email inválido.');
      return;
    }
    setSavingPerfil(true);
    try {
      await EntregadorService.atualizarDadosPessoais(token, {
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
      });
      Alert.alert('Salvo!', 'Dados pessoais atualizados com sucesso.');
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível atualizar os dados.');
    } finally {
      setSavingPerfil(false);
    }
  };

  const alterarSenha = async () => {
    if (!token) return;
    if (!senhaAtual) {
      Alert.alert('Erro', 'Informe a senha atual.');
      return;
    }
    if (novaSenha.length < 6) {
      Alert.alert('Erro', 'Nova senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmar) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }
    setSavingSenha(true);
    try {
      await EntregadorService.alterarSenha(token, senhaAtual, novaSenha);
      Alert.alert('Senha alterada!', 'Sua senha foi atualizada com sucesso.');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmar('');
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível alterar a senha.');
    } finally {
      setSavingSenha(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color="#000933" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Segurança</Text>
      </View>

      {loadingPerfil ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#F2760F" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Dados pessoais */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.sectionIcon}>
                <Ionicons name="person" size={16} color="#F2760F" />
              </View>
              <Text style={s.sectionTitle}>Dados pessoais</Text>
            </View>
            <Field label="Nome completo">
              <PlainInput value={nome} onChange={setNome} placeholder="Seu nome completo" />
            </Field>
            <Field label="Email">
              <PlainInput
                value={email}
                onChange={setEmail}
                placeholder="seu@email.com"
                keyboard="email-address"
              />
            </Field>
            <Field label="Telefone">
              <PlainInput
                value={telefone}
                onChange={setTelefone}
                placeholder="+55 79 9 0000-0000"
                keyboard="phone-pad"
              />
            </Field>
            <TouchableOpacity
              style={[s.saveBtn, savingPerfil && { opacity: 0.7 }]}
              onPress={salvarDados}
              activeOpacity={0.85}
              disabled={savingPerfil}
            >
              {savingPerfil ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={s.saveBtnText}>Salvar dados</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Segurança / Senha */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.sectionIcon}>
                <Ionicons name="lock-closed" size={16} color="#F2760F" />
              </View>
              <Text style={s.sectionTitle}>Alterar senha</Text>
            </View>
            <Field label="Senha atual">
              <SecureInput
                value={senhaAtual}
                onChange={setSenhaAtual}
                placeholder="Sua senha atual"
              />
            </Field>
            <Field label="Nova senha">
              <SecureInput
                value={novaSenha}
                onChange={setNovaSenha}
                placeholder="Mínimo 6 caracteres"
              />
            </Field>
            <Field label="Confirmar nova senha">
              <SecureInput
                value={confirmar}
                onChange={setConfirmar}
                placeholder="Repita a nova senha"
              />
            </Field>
            <TouchableOpacity
              style={[s.saveBtn, savingSenha && { opacity: 0.7 }]}
              onPress={alterarSenha}
              activeOpacity={0.85}
              disabled={savingSenha}
            >
              {savingSenha ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={s.saveBtnText}>Alterar senha</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7FB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7F1',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000933' },
  content: { padding: 16, paddingBottom: 40 },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#FEF0E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#000933' },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#2A3156', marginBottom: 6 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    backgroundColor: '#F6F7FB',
  },
  inputInner: { flex: 1, fontSize: 15, color: '#000933' },
  inputFocused: { borderColor: '#F2760F' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    backgroundColor: '#F2760F',
    borderRadius: 12,
    paddingVertical: 14,
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
