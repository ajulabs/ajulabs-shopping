import React from 'react';
import { useTheme } from '../../../../shared/hooks';
import type { Theme } from '../../../../shared/hooks/useTheme';
import { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSeguranca } from '../model/useSeguranca';
import { Field } from './components/SegurancaField';
import { SecureInput } from './components/SecureInput';
import { PlainInput } from './components/SegurancaPlainInput';

interface Props {
  onBack: () => void;
}

export function SegurancaScreen({ onBack }: Props) {
  const {
    nome,
    setNome,
    email,
    setEmail,
    telefone,
    setTelefone,
    loadingPerfil,
    savingPerfil,
    senhaAtual,
    setSenhaAtual,
    novaSenha,
    setNovaSenha,
    confirmar,
    setConfirmar,
    savingSenha,
    salvarDados,
    alterarSenha,
  } = useSeguranca();

  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
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

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      backgroundColor: theme.surf,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
    content: { padding: 16, paddingBottom: 40 },
    section: {
      backgroundColor: theme.surf,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
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
    sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.text },
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
}
