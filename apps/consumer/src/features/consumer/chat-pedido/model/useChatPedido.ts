import { useState, useEffect, useCallback } from 'react';
import { PedidoChatService } from '@ajulabs/api-client';
import { useChatPedidoRealtime } from '@ajulabs/realtime';
import type { ChatMensagemPedido } from '@ajulabs/types';
import { useAuthStore } from '../../../../store';
import { setCurrentChatPedido } from '../../../../shared/lib/currentChat';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export type Participante = 'LOJISTA' | 'ENTREGADOR';

export function useChatPedido(
  pedidoId: string | undefined,
  destinatarioParam: string | undefined,
  onNovaMensagem?: () => void,
) {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);

  const [chat, setChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [destinatario, setDestinatario] = useState<Participante>(
    destinatarioParam === 'ENTREGADOR' ? 'ENTREGADOR' : 'LOJISTA',
  );
  const [mensagens, setMensagens] = useState<ChatMensagemPedido[]>([]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);

  const carregarChat = useCallback(async () => {
    if (!token || !pedidoId) return;
    const data = await PedidoChatService.buscarChat(pedidoId, token);
    if (data) {
      setChat(data);
      setMensagens(data.mensagens ?? []);
      PedidoChatService.marcarLido(pedidoId, token).catch(() => {});
    }
    setLoading(false);
  }, [pedidoId, token]);

  useEffect(() => {
    carregarChat();
  }, [carregarChat]);

  // Marca este chat como "aberto" enquanto a tela está montada. O listener
  // de push em usePushRegistration descarta notificações de chat:mensagem
  // quando o pedidoId bate, evitando barulho desnecessário.
  useEffect(() => {
    if (!pedidoId) return;
    setCurrentChatPedido(pedidoId);
    return () => {
      setCurrentChatPedido(null);
    };
  }, [pedidoId]);

  useChatPedidoRealtime({
    apiUrl: API_URL,
    pedidoId: pedidoId ?? null,
    roomId: userId ?? null,
    roomType: 'usuario',
    enabled: !!userId,
    onMensagem: (payload) => {
      setMensagens((prev) => {
        if (prev.find((m) => m.id === payload.mensagem.id)) return prev;
        return [...prev, payload.mensagem as ChatMensagemPedido];
      });
      onNovaMensagem?.();
    },
  });

  const enviar = async () => {
    if (!input.trim() || enviando || !token || !pedidoId) return;
    const texto = input.trim();
    setInput('');
    setEnviando(true);
    try {
      const msg = await PedidoChatService.enviarMensagem(pedidoId, token, texto, destinatario);
      setMensagens((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg as ChatMensagemPedido];
      });
      onNovaMensagem?.();
    } catch {
      setInput(texto);
    } finally {
      setEnviando(false);
    }
  };

  const hasEntregador = chat?.participantes?.includes('ENTREGADOR');
  const chatEncerrado = chat?.status === 'encerrado';

  const msgsFiltradas = mensagens.filter(
    (m) =>
      (m.remetenteType === 'CONSUMER' && m.destinatarioType === destinatario) ||
      (m.destinatarioType === 'CONSUMER' && m.remetenteType === destinatario),
  );

  return {
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
  };
}
