import React, { useEffect, useRef } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatPedido } from '../model/useChatPedido';
import { ChatBubble, DestinatarioToggle } from './components';

interface Props {
  pedidoId: string;
  destinatario?: string;
  onBack?: () => void;
}

export function ChatPedidoScreen({ pedidoId, destinatario: destinatarioParam, onBack }: Props) {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const {
    chat,
    loading,
    destinatario,
    setDestinatario,
    mensagens,
    input,
    setInput,
    enviando,
    enviar,
    erroEnvio,
    hasEntregador,
    chatEncerrado,
    msgsFiltradas,
  } = useChatPedido(pedidoId, destinatarioParam, () =>
    scrollRef.current?.scrollToEnd({ animated: true }),
  );

  const handleBack = onBack ?? (() => router.back());

  useEffect(() => {
    if (mensagens.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [mensagens.length]);

  if (loading) {
    return (
      <SafeAreaView style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#DE6708" />
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
          <TouchableOpacity onPress={handleBack} style={s.backBtn}>
            <Ionicons name="chevron-back" size={20} color="#000933" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>
            {destinatario === 'CONSUMER'
              ? (chat?.consumidorNome ?? 'Cliente')
              : (chat?.entregadorNome ?? 'Entregador')}
          </Text>
          {chatEncerrado && <Text style={s.encerradoTag}>Encerrado</Text>}
        </View>

        {hasEntregador && (
          <DestinatarioToggle destinatario={destinatario} onChange={setDestinatario} />
        )}

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
          {msgsFiltradas.map((m) => (
            <ChatBubble key={m.id} mensagem={m} />
          ))}
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
  msgs: { padding: 16, gap: 8, paddingBottom: 8 },
  msgsEmpty: { alignItems: 'center', marginTop: 40 },
  msgsEmptyTxt: { fontSize: 13, color: '#9099B3' },
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
    backgroundColor: '#DE6708',
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
