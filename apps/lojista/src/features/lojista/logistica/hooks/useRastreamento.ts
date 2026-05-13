import { useState, useEffect } from 'react';
import { LojistaService } from '@ajulabs/api-client';
import { useDeliveryTracking } from '@ajulabs/realtime';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

interface Params {
  entregaId: string;
  lojaId: string | null;
  token: string | null;
}

interface Result {
  entregadorLocation: { lat: number; lng: number; heading?: number; speedKmh?: number } | null;
  connected: boolean;
}

export function useRastreamento({ entregaId, lojaId, token }: Params): Result {
  const [lastKnown, setLastKnown] = useState<{ lat: number; lng: number; heading?: number; speedKmh?: number } | null>(null);

  // REST fallback: busca última posição conhecida a cada 10s
  useEffect(() => {
    if (!token) return;
    const poll = () =>
      LojistaService.buscarLocalizacaoEntregador(entregaId, token)
        .then(loc => { if (loc) setLastKnown(loc); })
        .catch(() => {});
    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [entregaId, token]);

  const { entregadorLocation: realtimeLocation, connected } = useDeliveryTracking({
    apiUrl: API_URL,
    pedidoId: entregaId,
    roomId: lojaId,
    roomType: 'lojista',
    enabled: true,
  });

  return {
    entregadorLocation: realtimeLocation ?? lastKnown,
    connected,
  };
}
