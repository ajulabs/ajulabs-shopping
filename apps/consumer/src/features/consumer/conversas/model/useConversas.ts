import { useState, useEffect, useCallback, useMemo } from 'react';
import { PedidoChatService } from '@ajulabs/api-client';
import { useAuthStore } from '../../../../store';

export function useConversas() {
  const token = useAuthStore((s) => s.token);
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

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Agrupa as conversas por loja: um card por loja, representado pelo chat mais
  // recente. Sem isso, cada pedido vira um card e a lista fica poluida (varias
  // entradas identicas da mesma loja). Soma as nao-lidas de todos os pedidos.
  const conversasAgrupadas = useMemo(() => {
    const porLoja = new Map<string, any>();
    for (const chat of chats) {
      const chave = chat.lojaNome ?? chat.lojaId ?? chat.pedidoId;
      const existente = porLoja.get(chave);
      if (!existente) {
        porLoja.set(chave, { ...chat, naoLidas: chat.naoLidas ?? 0 });
        continue;
      }
      existente.naoLidas = (existente.naoLidas ?? 0) + (chat.naoLidas ?? 0);
      const tEx = existente.ultimaMensagem?.criadoEm ?? '';
      const tCh = chat.ultimaMensagem?.criadoEm ?? '';
      if (tCh > tEx) {
        existente.pedidoId = chat.pedidoId;
        existente.ultimaMensagem = chat.ultimaMensagem;
        existente.id = chat.id;
      }
    }
    return Array.from(porLoja.values());
  }, [chats]);

  return { chats: conversasAgrupadas, loading };
}
