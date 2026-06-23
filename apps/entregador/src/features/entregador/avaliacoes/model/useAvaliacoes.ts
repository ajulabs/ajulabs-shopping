import { useState, useEffect, useCallback } from 'react';
import { AvaliacaoService } from '@ajulabs/api-client';
import { type DashboardAvaliacoes } from '@ajulabs/types';
import { withAuthRefresh } from '../../../../shared/lib/withAuthRefresh';
import { useAuthEntregadorStore } from '../../../../store';

export const ACCENT = '#F2760F';

export function useAvaliacoes() {
  const token = useAuthEntregadorStore((s) => s.token);

  const [data, setData] = useState<DashboardAvaliacoes | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const dashboard = await withAuthRefresh((t) => AvaliacaoService.dashboardEntregador(t));
      setData(dashboard);
      setErro('');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar avaliações');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    carregar();
  }, [carregar]);

  return {
    data,
    loading,
    refreshing,
    erro,
    carregar,
    onRefresh,
  };
}
