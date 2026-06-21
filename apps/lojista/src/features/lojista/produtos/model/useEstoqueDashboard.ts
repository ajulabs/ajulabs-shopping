import { useState, useCallback, useEffect } from 'react';
import { EstoqueService, LojistaService } from '@ajulabs/api-client';
import { EstoqueDashboard as TDashboard, Produto } from '@ajulabs/types';
import { useAuthLojistaStore } from '../../../../store';

export function useEstoqueDashboard() {
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const token = useAuthLojistaStore((s) => s.token);

  const [dashboard, setDashboard] = useState<TDashboard | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ajusteTarget, setAjusteTarget] = useState<Produto | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const carregar = useCallback(
    async (silent = false) => {
      if (!lojaId || !token) return;
      if (!silent) setLoading(true);
      try {
        const [dash, lista] = await Promise.all([
          EstoqueService.getDashboard(lojaId, token),
          LojistaService.listarProdutos(lojaId, token),
        ]);
        setDashboard(dash);
        setProdutos(lista);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [lojaId, token],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    carregar(true);
  }, [carregar]);

  const onAjusteSaved = useCallback(
    (atualizado: Produto) => {
      setProdutos((prev) =>
        prev.map((p) => (p.id === atualizado.id ? { ...p, ...atualizado } : p)),
      );
      setAjusteTarget(null);
      carregar(true);
    },
    [carregar],
  );

  const markImgError = useCallback((id: string) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  }, []);

  return {
    lojaId,
    token,
    dashboard,
    produtos,
    loading,
    refreshing,
    ajusteTarget,
    setAjusteTarget,
    showPicker,
    setShowPicker,
    imgErrors,
    markImgError,
    onRefresh,
    onAjusteSaved,
  };
}
