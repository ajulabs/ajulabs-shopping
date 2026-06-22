import { useState, useEffect, useCallback, useRef } from 'react';
import { ScrollView } from 'react-native';
import { PedidoChatService } from '@ajulabs/api-client';
import { useChatPedidoRealtime } from '@ajulabs/realtime';
import type { ChatMensagemPedido } from '@ajulabs/types';
import { useAuthEntregadorStore } from '../../../../store';
import { setCurrentChatPedido } from '../../../../shared/lib/currentChat';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export type Destinatario = 'CONSUMER' | 'LOJISTA';

export function useChatPedidoEntregador(
  pedidoId: string,
  initialDestinatario: Destinatario = 'CONSUMER',
) {
  const token = useAuthEntregadorStore((s) => s.token);
  const entregadorId = useAuthEntregadorStore((s) => s.entregadorId);

  const [chat, setChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [destinatario, setDestinatario] = useState<Destinatario>(initialDestinatario);
  const [mensagens, setMensagens] = useState<ChatMensagemPedido[]>([]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const carregarChat = useCallback(async () => {
    if (!token) return;
    try {
      const data = await PedidoChatService.buscarChat(pedidoId, token);
      if (data) {
        setChat(data);
        setMensagens(data.mensagens ?? []);
        PedidoChatService.marcarLido(pedidoId, token).catch(() => {});
      } else {
        console.warn('[ChatEntregador] buscarChat retornou null. pedidoId:', pedidoId);
      }
    } catch (e: any) {
      console.error('[ChatEntregador] buscarChat error:', e?.message);
    }
    setLoading(false);
  }, [pedidoId, token]);

  useEffect(() => {
    carregarChat();
  }, [carregarChat]);

  // Marca este chat como aberto enquanto a tela está montada.
  useEffect(() => {
    setCurrentChatPedido(pedidoId);
    return () => {
      setCurrentChatPedido(null);
    };
  }, [pedidoId]);

  useChatPedidoRealtime({
    apiUrl: API_URL,
    pedidoId,
    roomId: entregadorId ?? null,
    roomType: 'entregador',
    enabled: !!entregadorId,
    onMensagem: (payload) => {
      setMensagens((prev) => {
        if (prev.find((m) => m.id === payload.mensagem.id)) return prev;
        return [...prev, payload.mensagem as ChatMensagemPedido];
      });
      scrollRef.current?.scrollToEnd({ animated: true });
    },
  });

  useEffect(() => {
    if (mensagens.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [mensagens.length]);

  const enviar = async () => {
    if (!input.trim() || enviando || !token) return;
    const texto = input.trim();
    setInput('');
    setErroEnvio(null);
    setEnviando(true);
    console.log('[ChatEntregador] enviando:', {
      pedidoId,
      destinatario,
      texto: texto.slice(0, 20),
    });
    try {
      const msg = await PedidoChatService.enviarMensagem(pedidoId, token, texto, destinatario);
      console.log('[ChatEntregador] mensagem enviada:', msg?.id);
      setMensagens((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg as ChatMensagemPedido];
      });
      scrollRef.current?.scrollToEnd({ animated: true });
    } catch (e: any) {
      setInput(texto);
      const msg = e?.message ?? 'Erro ao enviar mensagem';
      console.error('[ChatEntregador] enviarMensagem error:', msg, { pedidoId, destinatario });
      setErroEnvio(msg);
    } finally {
      setEnviando(false);
    }
  };

  const chatEncerrado = chat?.status === 'encerrado';

  const msgsFiltradas = mensagens.filter(
    (m) =>
      (m.remetenteType === 'ENTREGADOR' && m.destinatarioType === destinatario) ||
      (m.destinatarioType === 'ENTREGADOR' && m.remetenteType === destinatario),
  );

  const headerNome =
    destinatario === 'CONSUMER'
      ? (chat?.consumidorNome ?? 'Cliente')
      : (chat?.lojaNome ?? 'Lojista');

  return {
    chat,
    loading,
    destinatario,
    setDestinatario,
    mensagens,
    input,
    setInput,
    enviando,
    erroEnvio,
    scrollRef,
    enviar,
    chatEncerrado,
    msgsFiltradas,
    headerNome,
  };
}
