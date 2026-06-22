import { useEffect, useRef } from 'react';
import { getSocket } from '../client';

interface Options {
  apiUrl: string;
  entregadorId: string | null;
  pedidoId: string | null;
  enabled?: boolean;
  /**
   * Disparado quando o pedido ativo do entregador é cancelado — seja pelo lojista
   * (broadcast `corrida:cancelada` para a sala `entregadores`), seja por uma ação
   * em outro dispositivo do próprio entregador (`pedido:cancelado` direcionado
   * à sala `entregador:<id>`). Permite ao app sair da tela ativa sem esperar
   * o entregador esbarrar em um 404 no confirmarRetirada.
   */
  onCancelada: (payload: { pedidoId: string }) => void;
}

export function useCorridaAtivaRealtime({
  apiUrl,
  entregadorId,
  pedidoId,
  enabled = true,
  onCancelada,
}: Options): void {
  const cbRef = useRef(onCancelada);
  cbRef.current = onCancelada;

  useEffect(() => {
    if (!enabled || !entregadorId || !pedidoId || !apiUrl) return;

    const socket = getSocket(apiUrl);

    const onConnect = () => socket.emit('entregador:join', entregadorId);
    const onEvt = (payload: { pedidoId: string }) => {
      if (payload.pedidoId === pedidoId) cbRef.current(payload);
    };

    socket.on('connect', onConnect);
    socket.on('corrida:cancelada', onEvt);
    socket.on('pedido:cancelado', onEvt);
    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('corrida:cancelada', onEvt);
      socket.off('pedido:cancelado', onEvt);
    };
  }, [apiUrl, entregadorId, pedidoId, enabled]);
}
