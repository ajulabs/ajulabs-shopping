import { useEffect, useRef } from 'react';
import { getSocket } from '../client';
import type { TicketMensagemPayload } from '../events';

interface Options {
  apiUrl: string;
  ticketId: string | null;
  roomId: string | null;
  roomType: 'usuario' | 'lojista';
  enabled?: boolean;
  onMensagem?: (msg: TicketMensagemPayload) => void;
  onStatus?: (payload: { ticketId: string; status: string }) => void;
}

export function useTicketRealtime({
  apiUrl, ticketId, roomId, roomType, enabled = true, onMensagem, onStatus,
}: Options): void {
  const onMensagemRef = useRef(onMensagem);
  onMensagemRef.current = onMensagem;
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;
  const ticketIdRef = useRef(ticketId);
  ticketIdRef.current = ticketId;

  useEffect(() => {
    if (!enabled || !roomId || !apiUrl) return;

    const socket = getSocket(apiUrl);

    const onConnect = () => {
      if (roomType === 'usuario') socket.emit('usuario:join', roomId);
      else socket.emit('lojista:join', roomId);
    };

    const onMsg = (payload: TicketMensagemPayload) => {
      if (ticketIdRef.current && payload.ticketId !== ticketIdRef.current) return;
      onMensagemRef.current?.(payload);
    };

    const onSts = (payload: { ticketId: string; status: string }) => {
      if (ticketIdRef.current && payload.ticketId !== ticketIdRef.current) return;
      onStatusRef.current?.(payload);
    };

    socket.on('connect', onConnect);
    socket.on('ticket:mensagem', onMsg);
    socket.on('ticket:status', onSts);
    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('ticket:mensagem', onMsg);
      socket.off('ticket:status', onSts);
    };
  }, [apiUrl, roomId, roomType, enabled]);
}
