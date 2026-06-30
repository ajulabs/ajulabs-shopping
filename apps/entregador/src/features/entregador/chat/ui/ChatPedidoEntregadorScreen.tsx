import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatPedidoEntregador, Destinatario } from '../model/useChatPedidoEntregador';
import { useMemo } from 'react';
import { useTheme } from '../../../../shared/hooks';
import type { Theme } from '../../../../shared/hooks/useTheme';

interface Props {
  pedidoId: string;
  initialDestinatario?: Destinatario;
  onBack: () => void;
}

export function ChatPedidoEntregadorScreen({
  pedidoId,
  initialDestinatario = 'CONSUMER',
  onBack,
}: Props) {
  const {
    loading,
    destinatario,
    setDestinatario,
    input,
    setInput,
    enviando,
    erroEnvio,
    scrollRef,
    enviar,
    chatEncerrado,
    msgsFiltradas,
    headerNome,
  } = useChatPedidoEntregador(pedidoId, initialDestinatario);

  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  if (loading) {
    return (
      <SafeAreaView style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#F2760F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.header}>
          <TouchableOpacity onPress={onBack} style={s.backBtn}>
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{headerNome}</Text>
          {chatEncerrado && <Text style={s.encerradoTag}>Encerrado</Text>}
        </View>

        <View style={s.seletor}>
          {(['CONSUMER', 'LOJISTA'] as Destinatario[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[s.seletorBtn, destinatario === p && s.seletorBtnAtivo]}
              onPress={() => setDestinatario(p)}
            >
              <Ionicons
                name={p === 'CONSUMER' ? 'person-outline' : 'storefront-outline'}
                size={14}
                color={destinatario === p ? '#fff' : theme.text}
              />
              <Text style={[s.seletorTxt, { color: destinatario === p ? '#fff' : theme.text }]}>
                {p === 'CONSUMER' ? 'Cliente' : 'Lojista'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={s.msgs}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {msgsFiltradas.length === 0 && (
            <View style={s.msgsEmpty}>
              <Text style={s.msgsEmptyTxt}>Nenhuma mensagem ainda</Text>
            </View>
          )}
          {msgsFiltradas.map((m) => {
            const minha = m.remetenteType === 'ENTREGADOR';
            return (
              <View key={m.id} style={[s.msgWrapper, minha ? s.msgRight : s.msgLeft]}>
                {!minha && <Text style={s.msgNome}>{m.remetenteNome}</Text>}
                <View style={[s.bubble, minha ? s.bubbleMinha : s.bubbleDeles]}>
                  <Text style={[s.bubbleTxt, { color: minha ? '#fff' : theme.text }]}>
                    {m.conteudo}
                  </Text>
                </View>
                <Text style={s.hora}>
                  {new Date(m.criadoEm).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {erroEnvio && (
          <View style={s.erroRow}>
            <Ionicons name="alert-circle-outline" size={14} color="#B91C1C" />
            <Text style={s.erroTxt}>{erroEnvio}</Text>
          </View>
        )}

        {!chatEncerrado ? (
          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              placeholder="Digite uma mensagem..."
              placeholderTextColor={theme.textMut}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={enviar}
            />
            <TouchableOpacity
              style={[s.sendBtn, (!input.trim() || enviando) && { opacity: 0.5 }]}
              onPress={enviar}
              disabled={!input.trim() || enviando}
            >
              {enviando ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.encerradoBanner}>
            <Ionicons name="lock-closed-outline" size={14} color="#9099B3" />
            <Text style={s.encerradoBannerTxt}>Pedido finalizado — chat encerrado</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      backgroundColor: theme.bg,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: theme.text },
    encerradoTag: { fontSize: 11, color: theme.textMut },
    seletor: {
      flexDirection: 'row',
      gap: 8,
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.surf,
    },
    seletorBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      borderRadius: 20,
    },
    seletorBtnAtivo: { backgroundColor: '#F2760F' },
    seletorTxt: { fontSize: 13, fontWeight: '600' },
    msgs: { padding: 16, gap: 8, paddingBottom: 8 },
    msgsEmpty: { alignItems: 'center', marginTop: 40 },
    msgsEmptyTxt: { fontSize: 13, color: theme.textMut },
    msgWrapper: { maxWidth: '80%', gap: 3 },
    msgRight: { alignSelf: 'flex-end', alignItems: 'flex-end' },
    msgLeft: { alignSelf: 'flex-start', alignItems: 'flex-start' },
    msgNome: { fontSize: 11, fontWeight: '600', color: theme.textMut, marginLeft: 4 },
    bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
    bubbleMinha: { backgroundColor: '#F2760F' },
    bubbleDeles: { backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.border },
    bubbleTxt: { fontSize: 14, lineHeight: 20 },
    hora: { fontSize: 10, color: theme.textMut, marginHorizontal: 4 },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      padding: 12,
      backgroundColor: theme.surf,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    input: {
      flex: 1,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14,
      maxHeight: 100,
      backgroundColor: theme.surf2,
      color: theme.text,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#F2760F',
      alignItems: 'center',
      justifyContent: 'center',
    },
    encerradoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      padding: 14,
      backgroundColor: theme.surf,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    encerradoBannerTxt: { fontSize: 13, color: theme.textMut },
    erroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: '#FEF2F2',
    },
    erroTxt: { fontSize: 12, color: '#B91C1C', flex: 1 },
  });
}
