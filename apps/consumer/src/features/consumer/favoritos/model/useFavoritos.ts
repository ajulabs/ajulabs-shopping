import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Produto, Loja } from '@ajulabs/types';
import { FavoritoService, FavoritoLojaService } from '@ajulabs/api-client';
import { useAuthStore } from '../../../../store';

export function useFavoritos() {
  const token = useAuthStore((s) => s.token);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loadingProd, setLoadingProd] = useState(false);
  const [loadingLojas, setLoadingLojas] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoadingProd(true);
      setLoadingLojas(true);
      FavoritoService.listar(token)
        .then(setProdutos)
        .finally(() => setLoadingProd(false));
      FavoritoLojaService.listar(token)
        .then(setLojas)
        .finally(() => setLoadingLojas(false));
    }, [token]),
  );

  const handleRemoveProduto = (id: string) =>
    setProdutos((prev) => prev.filter((p) => p.id !== id));
  const handleRemoveLoja = (id: string) => setLojas((prev) => prev.filter((l) => l.id !== id));

  return {
    token,
    produtos,
    lojas,
    loadingProd,
    loadingLojas,
    handleRemoveProduto,
    handleRemoveLoja,
  };
}
