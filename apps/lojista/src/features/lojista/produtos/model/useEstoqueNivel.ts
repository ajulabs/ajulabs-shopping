import { useState, useCallback, useEffect } from 'react';
import { LojistaService } from '@ajulabs/api-client';
import { Produto, NivelEstoque } from '@ajulabs/types';
import { useAuthLojistaStore } from '../../../../store';
import { calcNivel } from '../../../../entities/produto';

export function useEstoqueNivel(nivel: NivelEstoque) {
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const token = useAuthLojistaStore((s) => s.token);

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ajusteTarget, setAjusteTarget] = useState<Produto | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const carregar = useCallback(
    async (silent = false) => {
      if (!lojaId || !token) return;
      if (!silent) setLoading(true);
      try {
        const lista = await LojistaService.listarProdutos(lojaId, token);
        const filtrados = lista.filter(
          (p) => calcNivel(p.estoque ?? 0, p.estoqueMinimo ?? 0) === nivel,
        );
        setProdutos(filtrados);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [lojaId, token, nivel],
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
        prev
          .map((p) => (p.id === atualizado.id ? { ...p, ...atualizado } : p))
          .filter((p) => calcNivel(p.estoque ?? 0, p.estoqueMinimo ?? 0) === nivel),
      );
      setAjusteTarget(null);
    },
    [nivel],
  );

  const markImgError = useCallback((id: string) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  }, []);

  return {
    lojaId,
    token,
    produtos,
    loading,
    refreshing,
    ajusteTarget,
    setAjusteTarget,
    imgErrors,
    markImgError,
    onRefresh,
    onAjusteSaved,
  };
}
