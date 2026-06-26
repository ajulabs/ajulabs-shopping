import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../../shared/hooks';
import { Ticket } from '../model/data';
import { useTicketDetail } from '../model/useTicketDetail';
import { dataCompleta, brl } from '../lib/format';
import { TicketStatusAction } from './components/TicketStatusAction';
import { TicketMessages } from './components/TicketMessages';
import { TicketNotas } from './components/TicketNotas';

interface Props {
  ticket: Ticket;
  token: string;
  onBack: () => void;
  onUpdate: (t: Ticket) => void;
}

export function TicketDetail({ ticket, token, onBack, onUpdate }: Props) {
  const theme = useTheme();
  const {
    nota,
    setNota,
    msg,
    setMsg,
    saving,
    addingNota,
    sendingMsg,
    scrollRef,
    proximoStatus,
    proximoLabel,
    meta,
    avancarStatus,
    toggleUrgente,
    enviarMensagem,
    enviarNota,
  } = useTicketDetail({ ticket, token, onUpdate });

  // Rola até o input quando o teclado abre (UX de digitação).
  const scrollToInput = () =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);

  return (
    <KeyboardAvoidingView
      style={[s.safe, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar
          barStyle={theme.isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.surf}
        />

        <View style={[s.header, { backgroundColor: theme.surf, borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={onBack}
            style={[s.backBtn, { backgroundColor: theme.surf2 }]}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[s.protocolo, { color: theme.text }]}>{ticket.protocolo}</Text>
            <Text style={[s.headerSub, { color: theme.textMut }]}>Ticket de suporte</Text>
          </View>
          <TouchableOpacity
            onPress={toggleUrgente}
            style={[s.urgenteBtn, ticket.urgente && s.urgenteBtnActive]}
            activeOpacity={0.8}
            disabled={saving}
          >
            <Ionicons name="flame" size={16} color={ticket.urgente ? '#fff' : '#9099B3'} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Status + ação */}
          <TicketStatusAction
            ticket={ticket}
            meta={meta}
            proximoStatus={proximoStatus}
            proximoLabel={proximoLabel}
            saving={saving}
            onAvancar={avancarStatus}
          />

          {/* Consumidor */}
          <View style={[s.section, { backgroundColor: theme.surf, borderColor: theme.border }]}>
            <Text style={[s.sectionTitle, { color: theme.textMut }]}>Consumidor</Text>
            <View style={s.infoRow}>
              <Ionicons name="person-outline" size={15} color={theme.textMut} />
              <Text style={[s.infoText, { color: theme.text }]}>{ticket.consumidor.nome}</Text>
            </View>
            <View style={s.infoRow}>
              <Ionicons name="call-outline" size={15} color={theme.textMut} />
              <Text style={[s.infoText, { color: theme.text }]}>{ticket.consumidor.telefone}</Text>
            </View>
          </View>

          {/* Motivo */}
          <View style={[s.section, { backgroundColor: theme.surf, borderColor: theme.border }]}>
            <Text style={[s.sectionTitle, { color: theme.textMut }]}>Motivo da reclamação</Text>
            <Text style={[s.motivoText, { color: theme.text }]}>{ticket.motivo}</Text>
            <Text style={[s.dataText, { color: theme.textMut }]}>
              Aberto em {dataCompleta(ticket.criadoEm)}
            </Text>
          </View>

          {/* Pedido vinculado */}
          {ticket.pedido && (
            <View style={[s.section, { backgroundColor: theme.surf, borderColor: theme.border }]}>
              <Text style={[s.sectionTitle, { color: theme.textMut }]}>Pedido vinculado</Text>
              <View
                style={[s.pedidoBox, { backgroundColor: theme.surf2, borderColor: theme.border }]}
              >
                <View style={s.pedidoHeader}>
                  <Text style={[s.pedidoId, { color: theme.text }]}>
                    #{ticket.pedido.id.slice(-8).toUpperCase()}
                  </Text>
                  <Text style={s.pedidoTotal}>{brl(ticket.pedido.total)}</Text>
                </View>
                <Text style={[s.pedidoData, { color: theme.textMut }]}>
                  {dataCompleta(ticket.pedido.criadoEm)}
                </Text>
                {ticket.pedido.itens.map((it, i) => (
                  <View key={i} style={s.itemRow}>
                    <Text style={s.itemQty}>{it.quantidade}×</Text>
                    <Text style={[s.itemNome, { color: theme.text }]}>{it.nomeSnapshot}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Mensagens com consumidor */}
          <TicketMessages
            ticket={ticket}
            msg={msg}
            setMsg={setMsg}
            sendingMsg={sendingMsg}
            onEnviar={enviarMensagem}
            onInputFocus={scrollToInput}
          />

          {/* Notas internas */}
          <TicketNotas
            ticket={ticket}
            nota={nota}
            setNota={setNota}
            addingNota={addingNota}
            onEnviar={enviarNota}
            onInputFocus={scrollToInput}
          />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7FB' },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7F1',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F1F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  protocolo: { fontSize: 16, fontWeight: '700', color: '#000933' },
  headerSub: { fontSize: 11, color: '#9099B3', marginTop: 1 },
  urgenteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F1F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgenteBtnActive: { backgroundColor: '#DC2626' },
  scroll: { flex: 1 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9099B3',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoText: { fontSize: 14, color: '#000933' },
  motivoText: { fontSize: 14, color: '#000933', lineHeight: 21, marginBottom: 6 },
  dataText: { fontSize: 11.5, color: '#9099B3' },
  pedidoBox: { backgroundColor: '#F6F7FB', borderRadius: 10, padding: 12 },
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  pedidoId: { fontSize: 14, fontWeight: '700', color: '#000933' },
  pedidoTotal: { fontSize: 14, fontWeight: '700', color: '#DE6708' },
  pedidoData: { fontSize: 11.5, color: '#9099B3', marginBottom: 8 },
  itemRow: { flexDirection: 'row', gap: 6, marginBottom: 3 },
  itemQty: { fontSize: 13, fontWeight: '700', color: '#9099B3' },
  itemNome: { fontSize: 13, color: '#000933' },
});
