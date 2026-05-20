import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LojistaService } from '@ajulabs/api-client';
import { Ticket, TicketMensagem, STATUS_META, STATUS_NEXT, STATUS_NEXT_LABEL, mapTicket } from '../model/data';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function dataCompleta(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

interface Props {
  ticket: Ticket;
  token: string;
  onBack: () => void;
  onUpdate: (t: Ticket) => void;
}

export function TicketDetail({ ticket, token, onBack, onUpdate }: Props) {
  const [nota, setNota]             = useState('');
  const [msg, setMsg]               = useState('');
  const [saving, setSaving]         = useState(false);
  const [addingNota, setAddingNota] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const proximoStatus = STATUS_NEXT[ticket.status];
  const proximoLabel  = STATUS_NEXT_LABEL[ticket.status];
  const meta          = STATUS_META[ticket.status];

  async function avancarStatus() {
    if (!proximoStatus) return;
    setSaving(true);
    try {
      await LojistaService.atualizarStatusTicket(ticket.id, proximoStatus, token);
      const raw = await LojistaService.buscarTicket(ticket.id, token);
      if (raw) onUpdate(mapTicket(raw));
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
    }
    setSaving(false);
  }

  async function toggleUrgente() {
    setSaving(true);
    try {
      await LojistaService.toggleUrgenteTicket(ticket.id, !ticket.urgente, token);
      onUpdate({ ...ticket, urgente: !ticket.urgente });
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o ticket.');
    }
    setSaving(false);
  }

  async function enviarMensagem() {
    if (!msg.trim()) return;
    setSendingMsg(true);
    try {
      const nova = await LojistaService.enviarMensagemTicket(ticket.id, msg.trim(), token);
      onUpdate({
        ...ticket,
        mensagens: [...ticket.mensagens, {
          id:        nova.id,
          remetente: 'lojista',
          texto:     nova.texto,
          criadoEm:  nova.criadoEm ?? nova.criado_em,
        }],
      });
      setMsg('');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
    }
    setSendingMsg(false);
  }

  async function enviarNota() {
    if (!nota.trim()) return;
    setAddingNota(true);
    try {
      const novaNota = await LojistaService.adicionarNotaTicket(ticket.id, nota.trim(), token);
      onUpdate({
        ...ticket,
        notas: [...ticket.notas, {
          id:       novaNota.id,
          texto:    novaNota.texto,
          criadoEm: novaNota.criadoEm ?? novaNota.criado_em,
        }],
      });
      setNota('');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a nota.');
    }
    setAddingNota(false);
  }

  return (
    <KeyboardAvoidingView
      style={s.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#000933" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.protocolo}>{ticket.protocolo}</Text>
          <Text style={s.headerSub}>Ticket de suporte</Text>
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

      <ScrollView ref={scrollRef} style={s.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Status + ação */}
        <View style={s.section}>
          <View style={s.statusRow}>
            <View style={[s.badge, { backgroundColor: meta.bg }]}>
              <Ionicons name={meta.icon as any} size={12} color={meta.color} style={{ marginRight: 4 }} />
              <Text style={[s.badgeText, { color: meta.color }]}>{meta.label}</Text>
            </View>
            {ticket.urgente && (
              <View style={s.urgentePill}>
                <Ionicons name="flame" size={11} color="#DC2626" />
                <Text style={s.urgentePillText}>Urgente</Text>
              </View>
            )}
          </View>

          {proximoStatus && (
            <TouchableOpacity
              style={s.avancarBtn}
              onPress={avancarStatus}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={s.avancarBtnText}>{proximoLabel}</Text>
                  <Ionicons name="chevron-forward" size={15} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          )}
          {!proximoStatus && (
            <View style={s.resolvidoBox}>
              <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
              <Text style={s.resolvidoText}>Ticket resolvido</Text>
            </View>
          )}
        </View>

        {/* Consumidor */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Consumidor</Text>
          <View style={s.infoRow}>
            <Ionicons name="person-outline" size={15} color="#9099B3" />
            <Text style={s.infoText}>{ticket.consumidor.nome}</Text>
          </View>
          <View style={s.infoRow}>
            <Ionicons name="call-outline" size={15} color="#9099B3" />
            <Text style={s.infoText}>{ticket.consumidor.telefone}</Text>
          </View>
        </View>

        {/* Motivo */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Motivo da reclamação</Text>
          <Text style={s.motivoText}>{ticket.motivo}</Text>
          <Text style={s.dataText}>Aberto em {dataCompleta(ticket.criadoEm)}</Text>
        </View>

        {/* Pedido vinculado */}
        {ticket.pedido && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Pedido vinculado</Text>
            <View style={s.pedidoBox}>
              <View style={s.pedidoHeader}>
                <Text style={s.pedidoId}>#{ticket.pedido.id.slice(-8).toUpperCase()}</Text>
                <Text style={s.pedidoTotal}>{brl(ticket.pedido.total)}</Text>
              </View>
              <Text style={s.pedidoData}>{dataCompleta(ticket.pedido.criadoEm)}</Text>
              {ticket.pedido.itens.map((it, i) => (
                <View key={i} style={s.itemRow}>
                  <Text style={s.itemQty}>{it.quantidade}×</Text>
                  <Text style={s.itemNome}>{it.nomeSnapshot}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Mensagens com consumidor */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Conversa com consumidor</Text>
          {ticket.mensagens.length === 0 ? (
            <Text style={s.semNotas}>Nenhuma mensagem ainda.</Text>
          ) : (
            ticket.mensagens.map((m: TicketMensagem) => (
              <View
                key={m.id}
                style={[
                  s.msgBubble,
                  m.remetente === 'lojista'
                    ? s.msgLojista
                    : s.msgConsumidor,
                ]}
              >
                <Text style={[s.msgRem, { color: m.remetente === 'lojista' ? '#000933' : '#DE6708' }]}>
                  {m.remetente === 'lojista' ? 'Você' : 'Consumidor'}
                </Text>
                <Text style={s.msgTxt}>{m.texto}</Text>
                <Text style={s.msgData}>{dataCompleta(m.criadoEm)}</Text>
              </View>
            ))
          )}

          {ticket.status !== 'resolvido' && ticket.status !== 'cancelado' && (
            <View style={s.notaInputRow}>
              <TextInput
                style={s.notaInput}
                value={msg}
                onChangeText={setMsg}
                placeholder="Responder ao consumidor..."
                placeholderTextColor="#C8CDE0"
                multiline
              />
              <TouchableOpacity
                style={[s.notaEnviarBtn, (!msg.trim() || sendingMsg) && { opacity: 0.4 }]}
                onPress={enviarMensagem}
                disabled={!msg.trim() || sendingMsg}
                activeOpacity={0.8}
              >
                {sendingMsg
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="send" size={16} color="#fff" />
                }
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Notas internas */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Notas internas</Text>
          {ticket.notas.length === 0 && (
            <Text style={s.semNotas}>Nenhuma nota ainda.</Text>
          )}
          {ticket.notas.map(n => (
            <View key={n.id} style={s.notaCard}>
              <Text style={s.notaTexto}>{n.texto}</Text>
              <Text style={s.notaData}>{dataCompleta(n.criadoEm)}</Text>
            </View>
          ))}

          <View style={s.notaInputRow}>
            <TextInput
              style={s.notaInput}
              value={nota}
              onChangeText={setNota}
              placeholder="Adicionar nota interna..."
              placeholderTextColor="#C8CDE0"
              multiline
            />
            <TouchableOpacity
              style={[s.notaEnviarBtn, (!nota.trim() || addingNota) && { opacity: 0.4 }]}
              onPress={enviarNota}
              disabled={!nota.trim() || addingNota}
              activeOpacity={0.8}
            >
              {addingNota
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="send" size={16} color="#fff" />
              }
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: '#F6F7FB' },
  header:   { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E4E7F1', gap: 10 },
  backBtn:  { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F1F7', alignItems: 'center', justifyContent: 'center' },
  protocolo: { fontSize: 16, fontWeight: '700', color: '#000933' },
  headerSub: { fontSize: 11, color: '#9099B3', marginTop: 1 },
  urgenteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F1F7', alignItems: 'center', justifyContent: 'center' },
  urgenteBtnActive: { backgroundColor: '#DC2626' },
  scroll:   { flex: 1 },
  section:  { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E4E7F1' },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#9099B3', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  badge:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  urgentePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, backgroundColor: '#FEE2E2' },
  urgentePillText: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  avancarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#000933', borderRadius: 12, paddingVertical: 12 },
  avancarBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  resolvidoBox: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 10 },
  resolvidoText: { fontSize: 14, fontWeight: '600', color: '#16A34A' },
  infoRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoText: { fontSize: 14, color: '#000933' },
  motivoText: { fontSize: 14, color: '#000933', lineHeight: 21, marginBottom: 6 },
  dataText: { fontSize: 11.5, color: '#9099B3' },
  pedidoBox: { backgroundColor: '#F6F7FB', borderRadius: 10, padding: 12 },
  pedidoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  pedidoId: { fontSize: 14, fontWeight: '700', color: '#000933' },
  pedidoTotal: { fontSize: 14, fontWeight: '700', color: '#DE6708' },
  pedidoData: { fontSize: 11.5, color: '#9099B3', marginBottom: 8 },
  itemRow:  { flexDirection: 'row', gap: 6, marginBottom: 3 },
  itemQty:  { fontSize: 13, fontWeight: '700', color: '#9099B3' },
  itemNome: { fontSize: 13, color: '#000933' },
  semNotas: { fontSize: 13, color: '#C8CDE0', marginBottom: 14 },
  notaCard: { backgroundColor: '#F6F7FB', borderRadius: 10, padding: 12, marginBottom: 8 },
  notaTexto: { fontSize: 13, color: '#000933', lineHeight: 19, marginBottom: 4 },
  notaData: { fontSize: 11, color: '#9099B3' },
  notaInputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', marginTop: 4 },
  notaInput: { flex: 1, borderWidth: 1, borderColor: '#E4E7F1', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#000933', maxHeight: 100, backgroundColor: '#fff' },
  notaEnviarBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#000933', alignItems: 'center', justifyContent: 'center' },
  msgBubble:    { borderRadius: 12, padding: 10, marginBottom: 8 },
  msgLojista:   { backgroundColor: '#EEF2FF', alignSelf: 'flex-end' as const, borderBottomRightRadius: 2 },
  msgConsumidor: { backgroundColor: '#F6F7FB', alignSelf: 'flex-start' as const, borderBottomLeftRadius: 2 },
  msgRem:       { fontSize: 10.5, fontWeight: '700' as const, marginBottom: 3, textTransform: 'uppercase' as const },
  msgTxt:       { fontSize: 13, color: '#000933', lineHeight: 19 },
  msgData:      { fontSize: 10.5, color: '#9099B3', marginTop: 4, textAlign: 'right' as const },
});
