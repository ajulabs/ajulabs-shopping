import { useEffect, useState, useCallback } from 'react';
import { AvaliacaoService } from '@ajulabs/api-client';
import { type DashboardAvaliacoes } from '@ajulabs/types';
import { useAuthLojistaStore } from '../../../../store';

export function useAvaliacoes() {
  const token = useAuthLojistaStore((s) => s.token);
  const lojaId = useAuthLojistaStore((s) => s.lojaId);

  const [data, setData] = useState<DashboardAvaliacoes | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    if (!token || !lojaId) {
      setLoading(false);
      return;
    }
    try {
      const dashboard = await AvaliacaoService.dashboardLojista(lojaId, token);
      setData(dashboard);
      setErro('');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar avaliações');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, lojaId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    carregar();
  }, [carregar]);

  return { data, loading, refreshing, erro, carregar, onRefresh };
}
