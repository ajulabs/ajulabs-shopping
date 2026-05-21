import { useEffect, useRef } from 'react';
import { getSocket } from '../client';
import type { PedidoNovoPayload } from '../events';

interface Options {
  apiUrl: string;
  lojaId: string | null;
  enabled?: boolean;
  onNovoPedido: (pedido: PedidoNovoPayload) => void;
}

export function usePedidosRealtime({ apiUrl, lojaId, enabled = true, onNovoPedido }: Options): void {
  const cbRef = useRef(onNovoPedido);
  cbRef.current = onNovoPedido;

  useEffect(() => {
    if (!enabled || !lojaId || !apiUrl) return;

    const socket = getSocket(apiUrl);

    const onConnect = () => socket.emit('lojista:join', lojaId);
    const onNovo = (payload: PedidoNovoPayload) => cbRef.current(payload);

    socket.on('connect', onConnect);
    socket.on('pedido:novo', onNovo);
    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('pedido:novo', onNovo);
    };
  }, [apiUrl, lojaId, enabled]);
}
