import { useState, useEffect, useRef } from 'react';
import { PedidoService } from '@ajulabs/api-client';
import { useDeliveryTracking } from '@ajulabs/realtime';
import { geocodeDestino } from '../lib/geocode';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

interface Params {
  pedidoId: string;
  token: string | null;
  userId: string | null;
  isActive: boolean;
  enderecoEntrega?: { rua?: string; numero?: string | null; bairro?: string } | null;
}

interface Result {
  entregadorLocation: { lat: number; lng: number } | null;
  destinoLocation: { lat: number; lng: number } | null;
}

export function useEntregadorTracking({ pedidoId, token, userId, isActive, enderecoEntrega }: Params): Result {
  const [lastKnownLocation, setLastKnownLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [destinoLocation, setDestinoLocation] = useState<{ lat: number; lng: number } | null>(null);
  const geocodedRef = useRef(false);

  const { entregadorLocation: realtimeLocation } = useDeliveryTracking({
    apiUrl: API_URL,
    pedidoId,
    roomId: userId,
    roomType: 'usuario',
    enabled: isActive,
  });

  const entregadorLocation = realtimeLocation ?? lastKnownLocation;

  // REST fallback: busca última posição conhecida a cada 10s
  useEffect(() => {
    if (!token || !isActive) return;
    const poll = () =>
      PedidoService.buscarLocalizacaoEntregador(pedidoId, token)
        .then(loc => { if (loc) setLastKnownLocation(loc); })
        .catch(() => {});
    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [pedidoId, token, isActive]);

  // Geocoding do endereço de entrega (executa uma vez)
  useEffect(() => {
    if (!enderecoEntrega?.rua || geocodedRef.current) return;
    geocodedRef.current = true;
    geocodeDestino(`${enderecoEntrega.rua}, ${enderecoEntrega.numero ?? ''}, ${enderecoEntrega.bairro}`)
      .then(loc => { if (loc) setDestinoLocation(loc); });
  }, [enderecoEntrega?.rua]);

  return { entregadorLocation, destinoLocation };
}
