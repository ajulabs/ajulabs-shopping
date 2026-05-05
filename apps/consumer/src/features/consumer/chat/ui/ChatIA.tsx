// src/features/consumer/chat/ui/ChatIA.tsx
import { useState } from 'react';
import { ShoppingCart } from 'lucide-react-native';
import { MensagemChat } from '@ajulabs/types';
import { ChatMsg } from './ChatMsg';
import { ChatInput } from './ChatInput';
import { matchAju } from '@ajulabs/api-client';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';


const SUGESTOES_INICIAIS = [
  'Tênis preto até R$200',
  'Presente pra mamãe',
  'Fone bluetooth',
];

const MENSAGEM_INICIAL: MensagemChat = {
  id: '0',
  remetente: 'aju',
  conteudo: 'Oi! Sou a Aju, sua personal shopper aqui de Aracaju 🧡 Me diz o que tá procurando que eu acho nas lojas daqui.',
  criadaEm: new Date().toISOString(),
};

export function ChatIA() {
  const [mensagens, setMensagens] = useState<MensagemChat[]>([MENSAGEM_INICIAL]);
  const [sugestoes, setSugestoes] = useState<string[]>(SUGESTOES_INICIAIS);
  const [carregando, setCarregando] = useState(false);

  async function handleEnviar(texto: string) {
    if (!texto.trim() || carregando) return;

    const msgUsuario: MensagemChat = {
      id: Date.now().toString(),
      remetente: 'usuario',
      conteudo: texto,
      criadaEm: new Date().toISOString(),
    };

    setMensagens((prev) => [...prev, msgUsuario]);
    setSugestoes([]);
    setCarregando(true);

    const resposta = await matchAju(mensagens, texto);

    const msgAju: MensagemChat = {
      id: (Date.now() + 1).toString(),
      remetente: 'aju',
      conteudo: resposta.texto,
      resposta,
      criadaEm: new Date().toISOString(),
    };

    setMensagens((prev) => [...prev, msgAju]);
    setCarregando(false);
  }

  // ChatIA.tsx — substitua o return completo

return (
  <KeyboardAvoidingView
    style={{ flex: 1, backgroundColor: '#f9fafb' }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
  >
    <View style={{ flex: 1 }}>

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 56,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 42, height: 42, borderRadius: 21,
            backgroundColor: '#f97316',
            alignItems: 'center', justifyContent: 'center',
            marginRight: 10,
          }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>A</Text>
          </View>
          <View>
            <Text style={{ fontWeight: '600', fontSize: 15, color: '#111827' }}>
              Aju · Personal Shopper
            </Text>
            <Text style={{ fontSize: 12, color: '#22c55e' }}>● Online agora</Text>
          </View>
        </View>
        <TouchableOpacity>
          <ShoppingCart size={22} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Mensagens */}
      <ChatMsg
        mensagens={mensagens}
        sugestoes={sugestoes}
        onSugestao={handleEnviar}
        carregando={carregando}
      />

      {/* Input */}
      <ChatInput onSend={handleEnviar} disabled={carregando} />

      {/* Rodapé */}
      <Text style={{
        textAlign: 'center', fontSize: 11,
        color: '#9ca3af', paddingBottom: 16,
      }}>
        IA com{' '}
        <Text style={{ color: '#f97316', fontWeight: '500' }}>lojas reais</Text>
        {' '}de Aracaju
      </Text>

    </View>
  </KeyboardAvoidingView>
);

}