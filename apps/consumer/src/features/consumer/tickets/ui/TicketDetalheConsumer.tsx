import { useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@ajulabs/theme';
import { useTheme, useSmartBack } from '../../../../shared/hooks';
import { STATUS_META, tempoRelativo, TicketMensagem } from '../model/data';
import { useTicketDetalhe } from '../model/useTicketDetalhe';
import { TicketTimeline } from './components/TicketTimeline';
import { AvaliacaoStars } from './components/AvaliacaoStars';

const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

function dataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TicketDetalheConsumer() {
  const router = useRouter();
  const goBack = useSmartBack('/(consumer)/tickets');
  const insets = useSafeAreaInsets();
  const { bg, surf, borderL, text, textSec, textMut, inputBg } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  const {
    ticket,
    loading,
    msg,
    setMsg,
    sending,
    avaliando,
    cancelando,
    enviarMensagem,
    cancelarTicket,
    avaliarTicket,
  } = useTicketDetalhe(() =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200),
  );

  if (loading) {
    return (
      <View
        style={[
          s.container,
          { backgroundColor: bg, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  if (!ticket) {
    return (
      <View
        style={[
          s.container,
          { backgroundColor: bg, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Text style={{ color: textSec as string }}>Ticket não encontrado.</Text>
      </View>
    );
  }

  const meta = STATUS_META[ticket.status];
  const podaEnviar = ticket.status !== 'cancelado' && ticket.status !== 'resolvido';
  const podeCancelar = ticket.status === 'aberto';
  const podeAvaliar = ticket.status === 'resolvido' && ticket.avaliacaoConsumidor === null;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <KeyboardAvoidingView
        style={[s.container, { backgroundColor: bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        {/* Header */}
        <View
          style={[
            s.header,
            { backgroundColor: surf, borderBottomColor: borderL, paddingTop: insets.top + 12 },
          ]}
        >
          <TouchableOpacity onPress={() => goBack()} style={s.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[s.protocolo, { color: text }]}>{ticket.protocolo}</Text>
            <Text style={[s.lojaHeader, { color: textSec as string }]}>
              {ticket.loja?.nome ?? '—'}
            </Text>
          </View>
          <View style={[s.badge, { backgroundColor: meta.bg }]}>
            <Ionicons name={meta.icon as any} size={11} color={meta.color} />
            <Text style={[s.badgeTxt, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Motivo */}
          <View style={[s.section, { backgroundColor: surf, borderColor: borderL }]}>
            <Text style={[s.sectionTitle, { color: textMut as string }]}>Motivo da reclamação</Text>
            <Text style={[s.motivoTxt, { color: text }]}>{ticket.motivo}</Text>
            <Text style={[s.dataAgo, { color: textMut as string }]}>
              Aberto {tempoRelativo(ticket.criadoEm)} atrás · {dataHora(ticket.criadoEm)}
            </Text>
          </View>

          {/* Pedido vinculado */}
          {ticket.pedido && (
            <View style={[s.section, { backgroundColor: surf, borderColor: borderL }]}>
              <Text style={[s.sectionTitle, { color: textMut as string }]}>Pedido vinculado</Text>
              <View style={s.pedidoRow}>
                <Text style={[s.pedidoId, { color: text }]}>
                  #{ticket.pedido.id.slice(-8).toUpperCase()}
                </Text>
                <Text style={[s.pedidoTotal, { color: colors.orange }]}>
                  {brl(ticket.pedido.total)}
                </Text>
              </View>
              {ticket.pedido.itens.slice(0, 3).map((it, i) => (
                <Text key={i} style={[s.pedidoItem, { color: textSec as string }]}>
                  {it.quantidade}× {it.nomeSnapshot}
                </Text>
              ))}
            </View>
          )}

          {/* Timeline */}
          <View style={[s.section, { backgroundColor: surf, borderColor: borderL }]}>
            <Text style={[s.sectionTitle, { color: textMut as string }]}>Andamento</Text>
            {ticket.status === 'cancelado' ? (
              <View style={s.canceladoBox}>
                <Ionicons name="close-circle" size={20} color={colors.n500} />
                <Text style={[s.canceladoTxt, { color: textSec as string }]}>Ticket cancelado</Text>
              </View>
            ) : (
              <TicketTimeline status={ticket.status} />
            )}
            {ticket.status === 'aberto' && (
              <Text style={[s.prazoTxt, { color: textMut as string }]}>
                Tempo médio de resposta: 24-48h
              </Text>
            )}
          </View>

          {/* Mensagens */}
          <View style={[s.section, { backgroundColor: surf, borderColor: borderL }]}>
            <Text style={[s.sectionTitle, { color: textMut as string }]}>Mensagens</Text>
            {ticket.mensagens.length === 0 ? (
              <Text style={[s.semMsg, { color: textMut as string }]}>Nenhuma mensagem ainda.</Text>
            ) : (
              ticket.mensagens.map((m: TicketMensagem) => (
                <View
                  key={m.id}
                  style={[
                    s.msgBubble,
                    m.remetente === 'consumidor'
                      ? [s.msgConsumidor, { backgroundColor: colors.orange100 }]
                      : [s.msgLojista, { backgroundColor: colors.n100 }],
                  ]}
                >
                  <Text
                    style={[
                      s.msgRem,
                      { color: m.remetente === 'consumidor' ? colors.orange600 : colors.navy },
                    ]}
                  >
                    {m.remetente === 'consumidor' ? 'Você' : (ticket.loja?.nome ?? 'Loja')}
                  </Text>
                  <Text style={[s.msgTxt, { color: text }]}>{m.texto}</Text>
                  <Text style={[s.msgData, { color: textMut as string }]}>
                    {dataHora(m.criadoEm)}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Avaliação */}
          {(podeAvaliar || ticket.avaliacaoConsumidor !== null) && (
            <View style={[s.section, { backgroundColor: surf, borderColor: borderL }]}>
              <Text style={[s.sectionTitle, { color: textMut as string }]}>Avaliação</Text>
              {avaliando ? (
                <ActivityIndicator size="small" color={colors.orange} />
              ) : (
                <AvaliacaoStars nota={ticket.avaliacaoConsumidor} onAvaliar={avaliarTicket} />
              )}
            </View>
          )}

          {/* Cancelar */}
          {podeCancelar && (
            <TouchableOpacity
              style={[s.cancelarBtn, cancelando && { opacity: 0.6 }]}
              onPress={cancelarTicket}
              disabled={cancelando}
              activeOpacity={0.8}
            >
              {cancelando ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <Text style={s.cancelarBtnTxt}>Cancelar reclamação</Text>
              )}
            </TouchableOpacity>
          )}

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Input de follow-up */}
        {podaEnviar && (
          <View
            style={[
              s.inputWrap,
              {
                backgroundColor: surf,
                borderTopColor: borderL,
                paddingBottom: 12 + insets.bottom,
              },
            ]}
          >
            <TextInput
              style={[s.input, { backgroundColor: inputBg, color: text, borderColor: borderL }]}
              value={msg}
              onChangeText={setMsg}
              placeholder="Enviar mensagem..."
              placeholderTextColor={textMut as string}
              multiline
            />
            <TouchableOpacity
              style={[s.sendBtn, (!msg.trim() || sending) && { opacity: 0.4 }]}
              onPress={enviarMensagem}
              disabled={!msg.trim() || sending}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.n0} />
              ) : (
                <Ionicons name="send" size={16} color={colors.n0} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.n100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  protocolo: { fontSize: 15, fontWeight: '700' },
  lojaHeader: { fontSize: 12, marginTop: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  badgeTxt: { fontSize: 11, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 8 },
  section: { borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1 },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  motivoTxt: { fontSize: 14, lineHeight: 21, marginBottom: 6 },
  dataAgo: { fontSize: 11.5 },
  pedidoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  pedidoId: { fontSize: 14, fontWeight: '700' },
  pedidoTotal: { fontSize: 14, fontWeight: '700' },
  pedidoItem: { fontSize: 13, marginBottom: 2 },
  canceladoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  canceladoTxt: { fontSize: 14 },
  prazoTxt: { fontSize: 12, marginTop: 10 },
  semMsg: { fontSize: 13, fontStyle: 'italic' },
  msgBubble: { borderRadius: 12, padding: 10, marginBottom: 8 },
  msgConsumidor: { alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  msgLojista: { alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  msgRem: { fontSize: 10.5, fontWeight: '700', marginBottom: 3, textTransform: 'uppercase' },
  msgTxt: { fontSize: 13, lineHeight: 19 },
  msgData: { fontSize: 10.5, marginTop: 4, textAlign: 'right' },
  cancelarBtn: {
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    marginBottom: 4,
  },
  cancelarBtnTxt: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
