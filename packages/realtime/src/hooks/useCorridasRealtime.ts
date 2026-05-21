import { useEffect, useRef } from 'react';
import { getSocket } from '../client';
import type { CorridaOfertaPayload } from '../events';

interface Options {
  apiUrl: string;
  entregadorId: string | null;
  enabled?: boolean;
  onOferta: (corrida: CorridaOfertaPayload) => void;
}

export function useCorridasRealtime({ apiUrl, entregadorId, enabled = true, onOferta }: Options): void {
  const cbRef = useRef(onOferta);
  cbRef.current = onOferta;

  useEffect(() => {
    if (!enabled || !entregadorId || !apiUrl) return;

    const socket = getSocket(apiUrl);

    const onConnect = () => socket.emit('entregador:join', entregadorId);
    const onOfertaEvt = (corrida: CorridaOfertaPayload) => cbRef.current(corrida);

    socket.on('connect', onConnect);
    socket.on('corrida:oferta', onOfertaEvt);
    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('corrida:oferta', onOfertaEvt);
    };
  }, [apiUrl, entregadorId, enabled]);
}
