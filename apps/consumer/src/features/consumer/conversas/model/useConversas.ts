import { useState, useEffect, useCallback } from 'react';
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

  return { chats, loading };
}
