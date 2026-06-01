import { useEffect, useRef } from 'react';
import { getSocket } from '../client';

interface LocationData {
  lat: number;
  lng: number;
  heading?: number;
  speedKmh?: number;
}

interface UseLocationEmitterOptions {
  apiUrl: string;
  pedidoId: string | null;
  entregadorId: string | null;
  location: LocationData | null;
  enabled?: boolean;
  intervalMs?: number;
}

export function useLocationEmitter({
  apiUrl,
  pedidoId,
  entregadorId,
  location,
  enabled = true,
  intervalMs = 5000,
}: UseLocationEmitterOptions): void {
  const lastEmitRef = useRef(0);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !entregadorId || !apiUrl) return;

    const socket = getSocket(apiUrl);

    const onConnect = () => {
      socket.emit('entregador:join', entregadorId);
      joinedRef.current = true;
    };

    socket.on('connect', onConnect);
    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      joinedRef.current = false;
    };
  }, [apiUrl, entregadorId, enabled]);

  useEffect(() => {
    if (!enabled || !pedidoId || !location || !apiUrl) return;

    const now = Date.now();
    if (now - lastEmitRef.current < intervalMs) return;
    lastEmitRef.current = now;

    const socket = getSocket(apiUrl);
    socket.emit('localizacao:update', {
      pedidoId,
      lat: location.lat,
      lng: location.lng,
      heading: location.heading,
      speedKmh: location.speedKmh,
    });
  }, [
    location?.lat,
    location?.lng,
    location?.heading,
    location?.speedKmh,
    pedidoId,
    enabled,
    apiUrl,
  ]);
}
