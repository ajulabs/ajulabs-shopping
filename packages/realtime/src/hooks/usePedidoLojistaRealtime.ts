import { useEffect, useRef } from 'react';
import { getSocket } from '../client';

interface Options {
  apiUrl: string;
  lojaId: string | null;
  enabled?: boolean;
  onAtualizado: (payload: { pedidoId: string; status: string }) => void;
}

export function usePedidoLojistaRealtime({ apiUrl, lojaId, enabled = true, onAtualizado }: Options): void {
  const cbRef = useRef(onAtualizado);
  cbRef.current = onAtualizado;

  useEffect(() => {
    if (!enabled || !lojaId || !apiUrl) return;

    const socket = getSocket(apiUrl);

    const onConnect = () => socket.emit('lojista:join', lojaId);
    const onAtual = (payload: { pedidoId: string; status: string }) => cbRef.current(payload);

    socket.on('connect', onConnect);
    socket.on('pedido:atualizado', onAtual);
    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('pedido:atualizado', onAtual);
    };
  }, [apiUrl, lojaId, enabled]);
}
