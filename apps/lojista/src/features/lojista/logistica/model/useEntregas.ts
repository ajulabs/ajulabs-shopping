import { useState, useEffect, useCallback } from 'react';
import { LojistaService } from '@ajulabs/api-client';
import { usePedidoLojistaRealtime } from '@ajulabs/realtime';
import { useAuthLojistaStore } from '../../../../store';
import { mapPedidoToEntrega } from '../lib/mappers';
import type { EntregaDisplay } from './types';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export function useEntregas() {
  const token = useAuthLojistaStore((s) => s.token);
  const lojaId = useAuthLojistaStore((s) => s.lojaId);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [emAndamento, setEmAndamento] = useState<EntregaDisplay[]>([]);
  const [concluidas, setConcluidas] = useState<EntregaDisplay[]>([]);

  const fetchData = useCallback(async () => {
    if (!token || !lojaId) {
      setLoading(false);
      return;
    }
    try {
      const { emAndamento: ea, concluidas: co } = await LojistaService.buscarEntregas(
        lojaId,
        token,
      );
      setEmAndamento(ea.map((p: any) => mapPedidoToEntrega(p, 'andamento')));
      setConcluidas(co.map((p: any) => mapPedidoToEntrega(p, 'concluida')));
    } catch {}
    setLoading(false);
  }, [token, lojaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  usePedidoLojistaRealtime({
    apiUrl: API_URL,
    lojaId: lojaId ?? null,
    enabled: !!lojaId,
    onAtualizado: fetchData,
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  return {
    token,
    lojaId,
    loading,
    refreshing,
    emAndamento,
    concluidas,
    handleRefresh,
  };
}
