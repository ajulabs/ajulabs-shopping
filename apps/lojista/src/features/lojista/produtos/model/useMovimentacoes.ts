import { useState, useCallback, useEffect } from 'react';
import { EstoqueService } from '@ajulabs/api-client';
import { MovimentacaoEstoque, TipoMovimentacao } from '@ajulabs/types';
import { useAuthLojistaStore } from '../../../../store';

export function useMovimentacoes() {
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const token = useAuthLojistaStore((s) => s.token);

  const [items, setItems] = useState<MovimentacaoEstoque[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState<TipoMovimentacao | ''>('');

  const carregar = useCallback(
    async (p = 1, tipo = filtro, silent = false) => {
      if (!lojaId || !token) return;
      if (!silent) {
        p === 1 ? setLoading(true) : setLoadingMore(true);
      }
      try {
        const res = await EstoqueService.getMovimentacoes(lojaId, token, {
          tipo: tipo || undefined,
          page: p,
          limit: 30,
        });
        setTotal(res.total);
        setItems((prev) => (p === 1 ? res.items : [...prev, ...res.items]));
        setPage(p);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [lojaId, token, filtro],
  );

  useEffect(() => {
    carregar(1);
  }, [carregar]);

  const changeFiltro = useCallback(
    (t: TipoMovimentacao | '') => {
      setFiltro(t);
      setItems([]);
      setPage(1);
      carregar(1, t);
    },
    [carregar],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    carregar(1, filtro, true);
  }, [carregar, filtro]);

  const onEndReached = useCallback(() => {
    if (!loadingMore && items.length < total) carregar(page + 1);
  }, [loadingMore, items.length, total, carregar, page]);

  return {
    items,
    total,
    loading,
    loadingMore,
    refreshing,
    filtro,
    changeFiltro,
    onRefresh,
    onEndReached,
  };
}
