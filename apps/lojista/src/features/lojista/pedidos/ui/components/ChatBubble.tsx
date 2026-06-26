import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ChatMensagemPedido } from '@ajulabs/types';
import { useTheme } from '../../../../../shared/hooks';

interface Props {
  mensagem: ChatMensagemPedido;
}

export function ChatBubble({ mensagem: m }: Props) {
  const theme = useTheme();
  const minha = m.remetenteType === 'LOJISTA';
  return (
    <View style={[s.msgWrapper, minha ? s.msgRight : s.msgLeft]}>
      {!minha && <Text style={[s.msgNome, { color: theme.textMut }]}>{m.remetenteNome}</Text>}
      <View
        style={[
          s.bubble,
          minha
            ? s.bubbleMinha
            : [s.bubbleDeles, { backgroundColor: theme.surf, borderColor: theme.border }],
        ]}
      >
        <Text style={[s.bubbleTxt, { color: minha ? '#fff' : theme.text }]}>{m.conteudo}</Text>
      </View>
      <Text style={[s.hora, { color: theme.textMut }]}>
        {new Date(m.criadoEm).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  msgWrapper: { maxWidth: '80%', gap: 3 },
  msgRight: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  msgLeft: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  msgNome: { fontSize: 11, fontWeight: '600', color: '#9099B3', marginLeft: 4 },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMinha: { backgroundColor: '#DE6708' },
  bubbleDeles: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E4E7F1' },
  bubbleTxt: { fontSize: 14, lineHeight: 20 },
  hora: { fontSize: 10, color: '#9099B3', marginHorizontal: 4 },
});
