import { useEffect, useRef } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@ajulabs/theme';
import { useTheme } from '../../../../shared/hooks';
import { useChatPedido, Participante } from '../model/useChatPedido';

export function ChatPedidoScreen() {
  const { pedidoId, destinatario: destinatarioParam } = useLocalSearchParams<{
    pedidoId: string;
    destinatario?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, bg, surf, border, borderL, text, textSec, backBtn } = useTheme();
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
    hasEntregador,
    chatEncerrado,
    msgsFiltradas,
  } = useChatPedido(pedidoId, destinatarioParam, () =>
    scrollRef.current?.scrollToEnd({ animated: true }),
  );

  useEffect(() => {
    if (mensagens.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [mensagens.length]);

  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: bg }]}>
        <View
          style={[
            styles.header,
            { backgroundColor: surf, borderBottomColor: borderL, paddingTop: insets.top + 12 },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.push(`/(consumer)/tracking/${pedidoId}`)}
            style={[styles.btnBack, { backgroundColor: backBtn }]}
          >
            <Ionicons name="chevron-back" size={20} color={text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: text }]}>Chat</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      </SafeAreaView>
    );
  }

  if (!chat) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: bg }]}>
        <View
          style={[
            styles.header,
            { backgroundColor: surf, borderBottomColor: borderL, paddingTop: insets.top + 12 },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.push(`/(consumer)/tracking/${pedidoId}`)}
            style={[styles.btnBack, { backgroundColor: backBtn }]}
          >
            <Ionicons name="chevron-back" size={20} color={text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: text }]}>Chat</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chatbubble-ellipses-outline" size={48} color={textSec as string} />
          <Text style={[styles.emptyTxt, { color: textSec as string }]}>Chat não disponível</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: surf, borderBottomColor: borderL, paddingTop: insets.top + 12 },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.push(`/(consumer)/tracking/${pedidoId}`)}
            style={[styles.btnBack, { backgroundColor: backBtn }]}
          >
            <Ionicons name="chevron-back" size={20} color={text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: text }]}>
              {destinatario === 'LOJISTA'
                ? (chat.lojaNome ?? 'Loja')
                : (chat.entregadorNome ?? 'Entregador')}
            </Text>
            {chatEncerrado && (
              <Text style={[styles.encerradoTag, { color: textSec as string }]}>
                Conversa encerrada
              </Text>
            )}
          </View>
        </View>

        {/* Seletor de participante */}
        {hasEntregador && (
          <View style={[styles.seletor, { backgroundColor: surf, borderBottomColor: borderL }]}>
            {(['LOJISTA', 'ENTREGADOR'] as Participante[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.seletorBtn, destinatario === p && styles.seletorBtnAtivo]}
                onPress={() => setDestinatario(p)}
              >
                <Ionicons
                  name={p === 'LOJISTA' ? 'storefront-outline' : 'bicycle-outline'}
                  size={15}
                  color={destinatario === p ? '#fff' : text}
                />
                <Text style={[styles.seletorTxt, { color: destinatario === p ? '#fff' : text }]}>
                  {p === 'LOJISTA' ? 'Loja' : 'Entregador'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Mensagens */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.msgs}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {msgsFiltradas.length === 0 && (
            <View style={styles.msgsEmpty}>
              <Text style={[styles.msgsEmptyTxt, { color: textSec as string }]}>
                Nenhuma mensagem ainda. Diga olá!
              </Text>
            </View>
          )}
          {msgsFiltradas.map((m) => {
            const minha = m.remetenteType === 'CONSUMER';
            return (
              <View
                key={m.id}
                style={[styles.msgWrapper, minha ? styles.msgWrapperRight : styles.msgWrapperLeft]}
              >
                {!minha && (
                  <Text style={[styles.msgNome, { color: textSec as string }]}>
                    {m.remetenteNome}
                  </Text>
                )}
                <View
                  style={[
                    styles.msgBubble,
                    minha
                      ? styles.bubbleMinha
                      : { backgroundColor: surf, borderColor: border, borderWidth: 1 },
                  ]}
                >
                  <Text style={[styles.msgTxt, { color: minha ? '#fff' : text }]}>
                    {m.conteudo}
                  </Text>
                </View>
                <Text style={[styles.msgHora, { color: textSec as string }]}>
                  {new Date(m.criadoEm).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Input */}
        {!chatEncerrado && (
          <View
            style={[
              styles.inputRow,
              { backgroundColor: surf, borderTopColor: borderL, paddingBottom: insets.bottom + 12 },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : colors.n100, color: text },
              ]}
              placeholder="Digite uma mensagem..."
              placeholderTextColor={textSec as string}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={1000}
              onSubmitEditing={enviar}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || enviando) && { opacity: 0.5 }]}
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
        )}

        {chatEncerrado && (
          <View
            style={[
              styles.encerradoBanner,
              { backgroundColor: surf, borderTopColor: borderL, paddingBottom: insets.bottom + 14 },
            ]}
          >
            <Ionicons name="lock-closed-outline" size={14} color={textSec as string} />
            <Text style={[styles.encerradoTxt, { color: textSec as string }]}>
              Pedido finalizado — chat encerrado
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  btnBack: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  encerradoTag: { fontSize: 11, marginTop: 1 },
  seletor: { flexDirection: 'row', gap: 8, padding: 12, borderBottomWidth: 1 },
  seletorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  seletorBtnAtivo: { backgroundColor: colors.orange },
  seletorTxt: { fontSize: 13, fontWeight: '600' },
  msgs: { padding: 16, paddingBottom: 8, gap: 8 },
  msgsEmpty: { alignItems: 'center', marginTop: 40 },
  msgsEmptyTxt: { fontSize: 13 },
  msgWrapper: { maxWidth: '80%', gap: 3 },
  msgWrapperRight: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  msgWrapperLeft: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  msgNome: { fontSize: 11, fontWeight: '600', marginLeft: 4 },
  msgBubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMinha: { backgroundColor: colors.orange },
  msgTxt: { fontSize: 14, lineHeight: 20 },
  msgHora: { fontSize: 10, marginHorizontal: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  encerradoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 14,
    borderTopWidth: 1,
  },
  encerradoTxt: { fontSize: 13 },
  emptyTxt: { fontSize: 15, fontWeight: '600', marginTop: 12 },
});
