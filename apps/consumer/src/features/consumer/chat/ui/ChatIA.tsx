import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { MensagemChat } from '@ajulabs/types';
import { ChatMsg } from './ChatMsg';
import { ChatInput } from './ChatInput';
import { matchAju } from '@ajulabs/api-client';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../../../store';
import { colors } from '@ajulabs/theme';

const SUGESTOES_INICIAIS = [
  'Tênis preto até R$200',
  'Presente pra mamãe',
  'Fone bluetooth',
];

const MENSAGEM_INICIAL: MensagemChat = {
  id: '0',
  remetente: 'aju',
  conteudo: 'Oi! Sou a Aju, sua personal shopper aqui de Aracaju. Me diz o que tá procurando que eu acho nas lojas daqui.',
  criadaEm: new Date().toISOString(),
};

export function ChatIA() {
  const [mensagens, setMensagens] = useState<MensagemChat[]>([MENSAGEM_INICIAL]);
  const [sugestoes, setSugestoes] = useState<string[]>(SUGESTOES_INICIAIS);
  const [carregando, setCarregando] = useState(false);
  const isDark = useThemeStore(s => s.isDark);

  const router = useRouter();

  const bg   = isDark ? colors.bgDark  : '#f9fafb';
  const surf = isDark ? colors.surfDark : '#fff';
  const borderL = isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6';
  const text = isDark ? colors.n0 : '#111827';
  const textSec = isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af';

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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={{ flex: 1 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 56,
          paddingBottom: 16,
          backgroundColor: surf,
          borderBottomWidth: 1,
          borderBottomColor: borderL,
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
              <Text style={{ fontWeight: '600', fontSize: 15, color: text }}>
                Aju · Personal Shopper
              </Text>
              <Text style={{ fontSize: 12, color: '#22c55e' }}>● Online agora</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/(consumer)/carrinho')}>
            <Ionicons name="cart-outline" size={22} color={text} />
          </TouchableOpacity>
        </View>

        <ChatMsg
          mensagens={mensagens}
          sugestoes={sugestoes}
          onSugestao={handleEnviar}
          carregando={carregando}
          isDark={isDark}
        />

        <ChatInput onSend={handleEnviar} disabled={carregando} isDark={isDark} />

        <Text style={{
          textAlign: 'center', fontSize: 11,
          color: textSec, paddingBottom: 16,
          backgroundColor: bg,
        }}>
          IA com{' '}
          <Text style={{ color: '#f97316', fontWeight: '500' }}>lojas reais</Text>
          {' '}de Aracaju
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
