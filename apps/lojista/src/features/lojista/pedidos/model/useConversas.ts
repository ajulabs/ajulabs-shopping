import { useState, useMemo, useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { PedidoChatService } from '@ajulabs/api-client';
import { useAuthLojistaStore } from '../../../../store';

export function useConversas() {
  const router = useRouter();
  const token = useAuthLojistaStore((s) => s.token);

  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const lista = await PedidoChatService.buscarHistorico(token);
      setChats(lista);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  // Agrupa por consumidor: um card por cliente, representado pelo chat mais
  // recente. Evita várias entradas idênticas do mesmo cliente (um por pedido).
  const conversas = useMemo(() => {
    const porConsumidor = new Map<string, any>();
    for (const chat of chats) {
      const chave = chat.consumidorNome ?? chat.consumidorId ?? chat.pedidoId;
      const existente = porConsumidor.get(chave);
      if (!existente) {
        // pedidoIds: todos os pedidos deste consumidor (pra marcar todos como
        // lidos ao abrir, não só o representante).
        porConsumidor.set(chave, {
          ...chat,
          naoLidas: chat.naoLidas ?? 0,
          pedidoIds: [chat.pedidoId],
        });
        continue;
      }
      existente.naoLidas = (existente.naoLidas ?? 0) + (chat.naoLidas ?? 0);
      existente.pedidoIds.push(chat.pedidoId);
      const tEx = existente.ultimaMensagem?.criadoEm ?? '';
      const tCh = chat.ultimaMensagem?.criadoEm ?? '';
      if (tCh > tEx) {
        existente.pedidoId = chat.pedidoId;
        existente.ultimaMensagem = chat.ultimaMensagem;
        existente.id = chat.id;
      }
    }
    return Array.from(porConsumidor.values());
  }, [chats]);

  // Abre o chat do pedido mais recente e marca como lidas as mensagens de TODOS
  // os pedidos do consumidor (senão o badge persiste por causa de pedidos antigos).
  const abrirConversa = useCallback(
    (chat: any) => {
      const ids: string[] = chat.pedidoIds ?? [chat.pedidoId];
      if (token) {
        ids.forEach((pid) => PedidoChatService.marcarLido(pid, token).catch(() => {}));
      }
      router.push(`/(lojista)/chat-pedido/${chat.pedidoId}` as any);
    },
    [token, router],
  );

  return { conversas, loading, abrirConversa };
}
