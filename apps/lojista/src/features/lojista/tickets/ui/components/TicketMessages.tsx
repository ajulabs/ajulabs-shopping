import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ticket, TicketMensagem } from '../../model/data';
import { dataCompleta } from '../../lib/format';

interface Props {
  ticket: Ticket;
  msg: string;
  setMsg: (v: string) => void;
  sendingMsg: boolean;
  onEnviar: () => void;
}

export function TicketMessages({ ticket, msg, setMsg, sendingMsg, onEnviar }: Props) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Conversa com consumidor</Text>
      {ticket.mensagens.length === 0 ? (
        <Text style={s.semNotas}>Nenhuma mensagem ainda.</Text>
      ) : (
        ticket.mensagens.map((m: TicketMensagem) => (
          <View
            key={m.id}
            style={[s.msgBubble, m.remetente === 'lojista' ? s.msgLojista : s.msgConsumidor]}
          >
            <Text style={[s.msgRem, { color: m.remetente === 'lojista' ? '#000933' : '#DE6708' }]}>
              {m.remetente === 'lojista' ? 'Você' : ticket.consumidor.nome}
            </Text>
            <Text style={s.msgTxt}>{m.texto}</Text>
            <Text style={s.msgData}>{dataCompleta(m.criadoEm)}</Text>
          </View>
        ))
      )}

      {ticket.status !== 'resolvido' && (
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
            onPress={onEnviar}
            disabled={!msg.trim() || sendingMsg}
            activeOpacity={0.8}
          >
            {sendingMsg ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
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
  semNotas: { fontSize: 13, color: '#C8CDE0', marginBottom: 14 },
  notaInputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', marginTop: 4 },
  notaInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#000933',
    maxHeight: 100,
    backgroundColor: '#fff',
  },
  notaEnviarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000933',
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgBubble: { borderRadius: 12, padding: 10, marginBottom: 8 },
  msgLojista: {
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-end' as const,
    borderBottomRightRadius: 2,
  },
  msgConsumidor: {
    backgroundColor: '#F6F7FB',
    alignSelf: 'flex-start' as const,
    borderBottomLeftRadius: 2,
  },
  msgRem: {
    fontSize: 10.5,
    fontWeight: '700' as const,
    marginBottom: 3,
    textTransform: 'uppercase' as const,
  },
  msgTxt: { fontSize: 13, color: '#000933', lineHeight: 19 },
  msgData: { fontSize: 10.5, color: '#9099B3', marginTop: 4, textAlign: 'right' as const },
});
