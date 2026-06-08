import { useEffect, useRef } from 'react';
import { getSocket } from '../client';
import type { CorridaOfertaPayload } from '../events';

interface Options {
  apiUrl: string;
  entregadorId: string | null;
  enabled?: boolean;
  onOferta: (corrida: CorridaOfertaPayload) => void;
  /**
   * Disparado quando QUALQUER entregador aceita uma corrida (evento emitido pelo
   * backend para a sala `entregadores`). Permite remover a corrida da lista de
   * espera em tempo real, sem esperar o polling, evitando que o entregador tente
   * aceitar uma corrida que já foi pega.
   */
  onAceita?: (payload: { pedidoId: string; entregadorId: string }) => void;
  /**
   * Disparado quando o lojista cancela um pedido que já estava em status 'pronto'
   * (ou seja, a corrida já havia sido ofertada). Remove a corrida da lista em
   * tempo real evitando tentativa de aceitar pedido cancelado.
   */
  onCancelada?: (payload: { pedidoId: string }) => void;
}

export function useCorridasRealtime({
  apiUrl,
  entregadorId,
  enabled = true,
  onOferta,
  onAceita,
  onCancelada,
}: Options): void {
  const ofertaRef = useRef(onOferta);
  ofertaRef.current = onOferta;
  const aceitaRef = useRef(onAceita);
  aceitaRef.current = onAceita;
  const canceladaRef = useRef(onCancelada);
  canceladaRef.current = onCancelada;

  useEffect(() => {
    if (!enabled || !entregadorId || !apiUrl) return;

    const socket = getSocket(apiUrl);

    const onConnect = () => socket.emit('entregador:join', entregadorId);
    const onOfertaEvt = (corrida: CorridaOfertaPayload) => ofertaRef.current(corrida);
    const onAceitaEvt = (payload: { pedidoId: string; entregadorId: string }) =>
      aceitaRef.current?.(payload);
    const onCanceladaEvt = (payload: { pedidoId: string }) => canceladaRef.current?.(payload);

    socket.on('connect', onConnect);
    socket.on('corrida:oferta', onOfertaEvt);
    socket.on('corrida:aceita', onAceitaEvt);
    socket.on('corrida:cancelada', onCanceladaEvt);
    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('corrida:oferta', onOfertaEvt);
      socket.off('corrida:aceita', onAceitaEvt);
      socket.off('corrida:cancelada', onCanceladaEvt);
    };
  }, [apiUrl, entregadorId, enabled]);
}
