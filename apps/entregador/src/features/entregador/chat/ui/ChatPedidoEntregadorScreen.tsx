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
            <Ionicons name="chevron-back" size={20} color="#000933" />
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
                color={destinatario === p ? '#fff' : '#000933'}
              />
              <Text style={[s.seletorTxt, { color: destinatario === p ? '#fff' : '#000933' }]}>
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
                  <Text style={[s.bubbleTxt, { color: minha ? '#fff' : '#000933' }]}>
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
              placeholderTextColor="#9099B3"
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7FB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#F6F7FB',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7F1',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E4E7F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#000933' },
  encerradoTag: { fontSize: 11, color: '#9099B3' },
  seletor: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7F1',
    backgroundColor: '#fff',
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
  msgsEmptyTxt: { fontSize: 13, color: '#9099B3' },
  msgWrapper: { maxWidth: '80%', gap: 3 },
  msgRight: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  msgLeft: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  msgNome: { fontSize: 11, fontWeight: '600', color: '#9099B3', marginLeft: 4 },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMinha: { backgroundColor: '#F2760F' },
  bubbleDeles: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E4E7F1' },
  bubbleTxt: { fontSize: 14, lineHeight: 20 },
  hora: { fontSize: 10, color: '#9099B3', marginHorizontal: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E4E7F1',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    backgroundColor: '#F0F1F7',
    color: '#000933',
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
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E4E7F1',
  },
  encerradoBannerTxt: { fontSize: 13, color: '#9099B3' },
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
