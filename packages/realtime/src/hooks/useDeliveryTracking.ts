import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../client';
import type { LocationPayload } from '../events';
import type { StatusPedido } from '@ajulabs/types';

interface TrackingState {
  entregadorLocation: { lat: number; lng: number; heading?: number; speedKmh?: number } | null;
  status: StatusPedido | null;
  connected: boolean;
}

interface UseDeliveryTrackingOptions {
  apiUrl: string;
  pedidoId: string | null;
  roomId: string | null;
  roomType: 'usuario' | 'lojista';
  enabled?: boolean;
}

export function useDeliveryTracking({
  apiUrl,
  pedidoId,
  roomId,
  roomType,
  enabled = true,
}: UseDeliveryTrackingOptions): TrackingState {
  const [entregadorLocation, setEntregadorLocation] =
    useState<TrackingState['entregadorLocation']>(null);
  const [status, setStatus] = useState<StatusPedido | null>(null);
  const [connected, setConnected] = useState(false);
  const pedidoIdRef = useRef(pedidoId);
  pedidoIdRef.current = pedidoId;

  useEffect(() => {
    if (!enabled || !roomId || !apiUrl) return;

    const socket = getSocket(apiUrl);

    const onConnect = () => {
      setConnected(true);
      if (roomType === 'usuario') socket.emit('usuario:join', roomId);
      else socket.emit('lojista:join', roomId);
    };

    const onDisconnect = () => setConnected(false);

    const onLocation = (payload: LocationPayload) => {
      if (payload.pedidoId !== pedidoIdRef.current) return;
      setEntregadorLocation({
        lat: payload.lat,
        lng: payload.lng,
        heading: payload.heading,
        speedKmh: payload.speedKmh,
      });
    };

    // O backend emite 'pedido:atualizado' (não 'pedido:status'). Antes este
    // listener nunca disparava, deixando o status sem atualização em tempo real.
    const onStatus = (payload: { pedidoId: string; status: string }) => {
      if (payload.pedidoId !== pedidoIdRef.current) return;
      setStatus(payload.status as StatusPedido);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('localizacao:entregador', onLocation);
    socket.on('pedido:atualizado', onStatus);

    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('localizacao:entregador', onLocation);
      socket.off('pedido:atualizado', onStatus);
    };
  }, [apiUrl, roomId, roomType, enabled]);

  return { entregadorLocation, status, connected };
}
