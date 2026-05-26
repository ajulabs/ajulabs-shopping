import { useEffect, useRef } from 'react';
import { getSocket } from '../client';
import type { ChatMensagemNovaPayload } from '../events';

interface Options {
  apiUrl: string;
  pedidoId: string | null;
  roomId: string | null;
  roomType: 'usuario' | 'lojista' | 'entregador';
  enabled?: boolean;
  onMensagem?: (payload: ChatMensagemNovaPayload) => void;
}

export function useChatPedidoRealtime({
  apiUrl,
  pedidoId,
  roomId,
  roomType,
  enabled = true,
  onMensagem,
}: Options): void {
  const onMensagemRef = useRef(onMensagem);
  onMensagemRef.current = onMensagem;
  const pedidoIdRef = useRef(pedidoId);
  pedidoIdRef.current = pedidoId;

  useEffect(() => {
    if (!enabled || !roomId || !apiUrl) return;

    const socket = getSocket(apiUrl);

    const onConnect = () => {
      if (roomType === 'usuario') socket.emit('usuario:join', roomId);
      else if (roomType === 'lojista') socket.emit('lojista:join', roomId);
      else socket.emit('entregador:join', roomId);
    };

    const onMsg = (payload: ChatMensagemNovaPayload) => {
      if (pedidoIdRef.current && payload.pedidoId !== pedidoIdRef.current) return;
      onMensagemRef.current?.(payload);
    };

    socket.on('connect', onConnect);
    socket.on('chat:mensagem:nova', onMsg);
    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('chat:mensagem:nova', onMsg);
    };
  }, [apiUrl, roomId, roomType, enabled]);
}
