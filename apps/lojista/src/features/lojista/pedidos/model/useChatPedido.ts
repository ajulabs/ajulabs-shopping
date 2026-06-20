import { useState, useEffect, useCallback } from 'react';
import { PedidoChatService } from '@ajulabs/api-client';
import { useChatPedidoRealtime } from '@ajulabs/realtime';
import type { ChatMensagemPedido } from '@ajulabs/types';
import { useAuthLojistaStore } from '../../../../store';
import { setCurrentChatPedido } from '../../../../shared/lib/currentChat';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export type Destinatario = 'CONSUMER' | 'ENTREGADOR';

export function useChatPedido(
  pedidoId: string | undefined,
  destinatarioParam?: string,
  onNovaMensagem?: () => void,
) {
  const token = useAuthLojistaStore((s) => s.token);
  const lojaId = useAuthLojistaStore((s) => s.lojaId);

  const [chat, setChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [destinatario, setDestinatario] = useState<Destinatario>(
    destinatarioParam === 'ENTREGADOR' ? 'ENTREGADOR' : 'CONSUMER',
  );
  const [mensagens, setMensagens] = useState<ChatMensagemPedido[]>([]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const carregarChat = useCallback(async () => {
    if (!token || !pedidoId) return;
    try {
      const data = await PedidoChatService.buscarChat(pedidoId, token);
      if (data) {
        setChat(data);
        setMensagens(data.mensagens ?? []);
        PedidoChatService.marcarLido(pedidoId, token).catch(() => {});
      }
    } catch {
      // mantém a tela utilizável mesmo se a busca falhar
    }
    setLoading(false);
  }, [pedidoId, token]);

  useEffect(() => {
    carregarChat();
  }, [carregarChat]);

  // Marca este chat como aberto enquanto a tela está montada.
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
    roomId: lojaId ?? null,
    roomType: 'lojista',
    enabled: !!lojaId,
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
    setErroEnvio(null);
    setEnviando(true);
    try {
      const msg = await PedidoChatService.enviarMensagem(pedidoId, token, texto, destinatario);
      setMensagens((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg as ChatMensagemPedido];
      });
      onNovaMensagem?.();
    } catch (e: any) {
      setInput(texto);
      setErroEnvio(e?.message ?? 'Erro ao enviar mensagem');
    } finally {
      setEnviando(false);
    }
  };

  const hasEntregador =
    chat?.participantes?.includes('ENTREGADOR') || destinatarioParam === 'ENTREGADOR';
  const chatEncerrado = chat?.status === 'encerrado';

  const msgsFiltradas = mensagens.filter(
    (m) =>
      (m.remetenteType === 'LOJISTA' && m.destinatarioType === destinatario) ||
      (m.destinatarioType === 'LOJISTA' && m.remetenteType === destinatario),
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
    erroEnvio,
    hasEntregador,
    chatEncerrado,
    msgsFiltradas,
  };
}
