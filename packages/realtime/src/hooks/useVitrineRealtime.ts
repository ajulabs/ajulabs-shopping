import { useEffect, useRef } from 'react';
import { getSocket } from '../client';
import type { VitrineAtualizadaPayload } from '../events';

interface Options {
  apiUrl: string;
  lojaId: string | null;
  enabled?: boolean;
  onAtualizada?: (payload: VitrineAtualizadaPayload) => void;
}

/**
 * Mantém o consumidor inscrito na vitrine de uma loja enquanto a navega.
 * Quando o lojista cria/edita/remove um produto, dispara onAtualizada para o
 * app refazer a busca do catálogo — sem precisar sair e voltar na loja.
 */
export function useVitrineRealtime({
  apiUrl,
  lojaId,
  enabled = true,
  onAtualizada,
}: Options): void {
  const onAtualizadaRef = useRef(onAtualizada);
  onAtualizadaRef.current = onAtualizada;

  useEffect(() => {
    if (!enabled || !lojaId || !apiUrl) return;

    const socket = getSocket(apiUrl);

    const onConnect = () => socket.emit('vitrine:join', lojaId);

    const onAtual = (payload: VitrineAtualizadaPayload) => {
      if (payload.lojaId !== lojaId) return;
      onAtualizadaRef.current?.(payload);
    };

    socket.on('connect', onConnect);
    socket.on('vitrine:atualizada', onAtual);
    if (socket.connected) onConnect();

    return () => {
      socket.emit('vitrine:leave', lojaId);
      socket.off('connect', onConnect);
      socket.off('vitrine:atualizada', onAtual);
    };
  }, [apiUrl, lojaId, enabled]);
}
